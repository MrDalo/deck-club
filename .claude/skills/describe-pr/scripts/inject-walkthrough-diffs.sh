#!/usr/bin/env bash
# Inject selected unified-diff hunks into a PR walkthrough's hidden diff stash.
#
# Usage:
#   inject-walkthrough-diffs.sh TARGET [BASE_DIR] [SOURCE] [OPTIONS]
#
# Sources (choose at most one; default is --range main...HEAD):
#   --pr PR             Read an existing local, remote, or fork PR with `gh pr diff`.
#   --range REV         Read a checked-out branch with `git diff REV`.
#   --diff-file FILE    Read a previously captured unified diff (also useful in tests).
#
# Options:
#   --base-dir DIR      Repository used by --pr or --range (default: .).
#   --max-lines N       Keep at most N lines per file, then add an elision marker.
#                       Zero means unlimited (default: 0).
#   -h, --help          Show this help.
#
# TARGET must contain exactly one `<div id="diffs" hidden>` stash and at least one
# `diffFile: "path"` entry. The script replaces the whole stash deterministically.
# It fails before editing TARGET when any requested path is absent from the diff.
set -euo pipefail

usage() { awk 'NR == 1 { next } /^#/ { sub(/^# ?/, ""); print; next } { exit }' "$0"; }
die() { printf 'inject-walkthrough-diffs: %s\n' "$*" >&2; exit 2; }
need_value() {
  [ "$#" -ge 2 ] && [ -n "$2" ] || die "$1 requires a value"
  case "$2" in --*) die "$1 requires a value" ;; esac
}

TARGET=""
BASE_DIR="."
PR=""
RANGE=""
DIFF_FILE=""
MAX_LINES=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --base-dir)
      need_value "$@"; BASE_DIR="$2"; shift 2 ;;
    --pr)
      need_value "$@"; PR="$2"; shift 2 ;;
    --range)
      need_value "$@"; RANGE="$2"; shift 2 ;;
    --diff-file)
      need_value "$@"; DIFF_FILE="$2"; shift 2 ;;
    --max-lines)
      need_value "$@"; MAX_LINES="$2"; shift 2 ;;
    -h|--help)
      usage; exit 0 ;;
    --*)
      die "unknown option $1" ;;
    *)
      if [ -z "$TARGET" ]; then
        TARGET="$1"
      elif [ "$BASE_DIR" = "." ]; then
        BASE_DIR="$1"
      else
        die "unexpected argument $1"
      fi
      shift ;;
  esac
done

[ -n "$TARGET" ] || { usage >&2; die 'missing TARGET'; }
[ -f "$TARGET" ] || die "no such target file: $TARGET"
[ -d "$BASE_DIR" ] || die "no such base directory: $BASE_DIR"
case "$MAX_LINES" in
  ''|*[!0-9]*) die '--max-lines must be a non-negative integer' ;;
esac

SOURCE_COUNT=0
[ -n "$PR" ] && SOURCE_COUNT=$((SOURCE_COUNT + 1))
[ -n "$RANGE" ] && SOURCE_COUNT=$((SOURCE_COUNT + 1))
[ -n "$DIFF_FILE" ] && SOURCE_COUNT=$((SOURCE_COUNT + 1))
[ "$SOURCE_COUNT" -le 1 ] || die 'choose only one of --pr, --range, or --diff-file'
[ -z "$DIFF_FILE" ] || [ -f "$DIFF_FILE" ] || die "no such diff file: $DIFF_FILE"

OPEN_COUNT="$(grep -Ec '^[[:space:]]*<div id="diffs"([[:space:]>])' "$TARGET" || true)"
[ "$OPEN_COUNT" -eq 1 ] || die "target must contain exactly one <div id=\"diffs\" ...> stash (found $OPEN_COUNT)"
START_COUNT="$(grep -c '^<!-- inject-walkthrough-diffs:start (generated; rerun to refresh) -->$' "$TARGET" || true)"
END_COUNT="$(grep -c '^<!-- inject-walkthrough-diffs:end -->$' "$TARGET" || true)"
if [ "$START_COUNT" -ne "$END_COUNT" ] || [ "$START_COUNT" -gt 1 ]; then
  die 'target contains an incomplete or duplicate generated stash'
fi

TMP="$(mktemp -d "${TMPDIR:-/tmp}/inject-walkthrough-diffs.XXXXXX")"
trap 'rm -rf "$TMP"' EXIT HUP INT TERM
WANTED="$TMP/wanted"
RAW_DIFF="$TMP/raw.diff"
STASH="$TMP/stash"
MISSING="$TMP/missing"
OUT="$TMP/output.html"
NODE_SOURCE="$TMP/node-source.html"

awk '
  $0 == "<!-- inject-walkthrough-diffs:start (generated; rerun to refresh) -->" { generated = 1; next }
  $0 == "<!-- inject-walkthrough-diffs:end -->" { generated = 0; next }
  !generated { print }
' "$TARGET" > "$NODE_SOURCE"

LC_ALL=C grep -oE 'diffFile:[[:space:]]*"[^"]+"' "$NODE_SOURCE" \
  | sed -E 's/^diffFile:[[:space:]]*"([^"]+)"$/\1/' \
  | LC_ALL=C sort -u > "$WANTED"
[ -s "$WANTED" ] || die "no diffFile entries found in $TARGET"

if [ -n "$PR" ]; then
  (cd "$BASE_DIR" && gh pr diff "$PR") > "$RAW_DIFF"
elif [ -n "$DIFF_FILE" ]; then
  cp "$DIFF_FILE" "$RAW_DIFF"
else
  (cd "$BASE_DIR" && git -c core.quotePath=false diff --find-renames "${RANGE:-main...HEAD}") > "$RAW_DIFF"
fi

# Split on file headers. Prefer the +++ destination path, fall back to rename or
# binary headers for patchless changes, and use the --- source path for deletes.
# The header and every subsequent line are kept byte-for-byte except literal
# closing script tags, which HTML cannot contain.
awk -v wantedfile="$WANTED" -v missingfile="$MISSING" -v maxlines="$MAX_LINES" '
  function clean_header_path(value) {
    sub(/^[ab]\//, "", value)
    return value
  }
  function flush(   i, limit, line) {
    if (nbuf == 0) return
    selected = newpath != "/dev/null" ? clean_header_path(newpath) : clean_header_path(oldpath)
    if (!(selected in wanted)) return
    seen[selected] = 1
    printf "<script type=\"text/plain\" data-diff=\"%s\">\n", selected
    limit = nbuf
    if (maxlines > 0 && limit > maxlines) limit = maxlines
    for (i = 1; i <= limit; i++) {
      line = buf[i]
      gsub(/<\/script>/, "<\\/script>", line)
      print line
    }
    if (maxlines > 0 && nbuf > maxlines)
      printf "@@ … %d more lines elided; open the PR for the full hunk @@\n", nbuf - maxlines
    print "</script>"
  }
  BEGIN {
    while ((getline line < wantedfile) > 0) if (line != "") wanted[line] = 1
  }
  /^diff --git / {
    flush()
    nbuf = 0
    oldpath = ""
    newpath = ""
    for (path in wanted) {
      oldprefix = "diff --git a/" path " "
      newsuffix = " b/" path
      if (index($0, oldprefix) == 1) oldpath = path
      if (length($0) >= length(newsuffix) && substr($0, length($0) - length(newsuffix) + 1) == newsuffix)
        newpath = path
    }
  }
  {
    if ($0 ~ /^diff --git / || nbuf > 0) buf[++nbuf] = $0
    if ($0 ~ /^--- /) oldpath = substr($0, 5)
    if ($0 ~ /^\+\+\+ /) newpath = substr($0, 5)
    if ($0 ~ /^rename from /) oldpath = substr($0, 13)
    if ($0 ~ /^rename to /) newpath = substr($0, 11)
    if ($0 ~ /^Binary files /) {
      binary = $0
      sub(/^Binary files /, "", binary)
      sub(/ differ$/, "", binary)
      separator = index(binary, " and ")
      if (separator > 0) {
        oldpath = substr(binary, 1, separator - 1)
        newpath = substr(binary, separator + 5)
      }
    }
  }
  END {
    flush()
    for (path in wanted) if (!(path in seen)) print path > missingfile
  }
' "$RAW_DIFF" > "$STASH"

if [ -s "$MISSING" ]; then
  printf 'inject-walkthrough-diffs: requested paths missing from the selected diff:\n' >&2
  sed 's/^/  - /' "$MISSING" >&2
  exit 1
fi

HAS_MARKERS=0
[ "$START_COUNT" -eq 1 ] && HAS_MARKERS=1
awk -v stashfile="$STASH" -v hasmarkers="$HAS_MARKERS" '
  BEGIN {
    start = "<!-- inject-walkthrough-diffs:start (generated; rerun to refresh) -->"
    end = "<!-- inject-walkthrough-diffs:end -->"
    state = 0
    found = 0
  }
  state == 0 && /^[[:space:]]*<div id="diffs"([[:space:]>])/ {
    print
    print start
    while ((getline line < stashfile) > 0) print line
    print end
    state = hasmarkers ? 1 : 2
    found++
    next
  }
  state == 1 {
    if ($0 == end) state = 2
    next
  }
  state == 2 {
    if ($0 ~ /^[[:space:]]*<\/div>[[:space:]]*$/) {
      print
      state = 0
    }
    next
  }
  { print }
  END {
    if (found != 1 || state != 0) exit 3
  }
' "$TARGET" > "$OUT" || die 'could not locate a complete #diffs stash boundary'

cp "$OUT" "$TARGET"
INJECTED="$(grep -c '^<script type="text/plain" data-diff=' "$STASH" || true)"
WANTED_COUNT="$(wc -l < "$WANTED" | tr -d '[:space:]')"
printf 'inject-walkthrough-diffs: injected %s/%s file diffs into %s\n' "$INJECTED" "$WANTED_COUNT" "$TARGET"
