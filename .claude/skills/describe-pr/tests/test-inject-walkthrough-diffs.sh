#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INJECTOR="$SCRIPT_DIR/../scripts/inject-walkthrough-diffs.sh"
FIXTURE_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/inject-walkthrough-test.XXXXXX")"
trap 'rm -rf "$FIXTURE_ROOT"' EXIT HUP INT TERM

run_case() {
  local name="$1"
  local wanted="$2"
  local diff_body="$3"
  local target="$FIXTURE_ROOT/$name.html"
  local diff_file="$FIXTURE_ROOT/$name.diff"

  printf '%s\n' \
    '<!doctype html>' \
    '<script>' \
    "const slides = [{ diffFile: \"$wanted\" }];" \
    '</script>' \
    '<div id="diffs" hidden>' \
    '</div>' > "$target"
  printf '%s\n' "$diff_body" > "$diff_file"

  "$INJECTOR" "$target" --diff-file "$diff_file" >/dev/null
  grep -Fq "data-diff=\"$wanted\"" "$target"
}

run_case pure-rename renamed.txt 'diff --git a/old.txt b/renamed.txt
similarity index 100%
rename from old.txt
rename to renamed.txt'

run_case binary-only image.bin 'diff --git a/image.bin b/image.bin
new file mode 100644
index 0000000..e69de29
Binary files /dev/null and b/image.bin differ'

run_case mode-only mode.txt 'diff --git a/mode.txt b/mode.txt
old mode 100644
new mode 100755'

printf 'inject walkthrough edge cases: ok\n'
