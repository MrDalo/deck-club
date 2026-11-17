#!/usr/bin/env bash
# Packs this repository into a clean zip for an Alignerr / Code Behaviors
# task upload, then checks the staged copy against the upload rules:
#   - no .git folder, no dependency or build output
#   - no files that change model behaviour (CLAUDE.md, AGENTS.md, .claude/,
#     .agents/, skills) — .github/ may stay
#   - a .gitignore that covers dependency, cache and build folders
#   - no real .env files, secrets or personal data
#
# Usage:  pnpm pack:alignerr [task-slug]
# Output: ~/Desktop/deck-club-alignerr-<task-slug>.zip
#
# Personal terms to scan for are never written into this repository. They
# come from `git config user.name` / `user.email`, the GitHub owner of the
# origin remote, the local .env (the Supabase project ref), and, optionally,
# a git-ignored `.pack-denylist` file with one extra term per line.
# The script exits non-zero and does not write the zip if any check fails.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NAME="deck-club"
SLUG="${1:-task}"
WORKDIR="$(mktemp -d)"
STAGE="$WORKDIR/$NAME"
OUT_ZIP="$HOME/Desktop/${NAME}-alignerr-${SLUG}.zip"
FAILED=0

cleanup() { rm -rf "$WORKDIR"; }
trap cleanup EXIT

fail() {
  echo "  FAIL: $1"
  FAILED=1
}

echo "Staging a clean copy in $STAGE ..."
mkdir -p "$STAGE"
rsync -a "$REPO_DIR"/ "$STAGE"/ \
  --exclude ".git/" \
  --exclude "node_modules/" \
  --exclude ".pnpm-store/" \
  --exclude ".next/" \
  --exclude "/apps/*/out/" \
  --exclude "dist/" \
  --exclude "/apps/*/build/" \
  --exclude "coverage/" \
  --exclude ".turbo/" \
  --exclude ".cache/" \
  --exclude ".vercel/" \
  --exclude ".vitest/" \
  --exclude ".swc/" \
  --exclude "/apps/api/data/" \
  --exclude "*.db" \
  --exclude "*.db-*" \
  --exclude ".claude/" \
  --exclude ".agents/" \
  --exclude ".agent-work/" \
  --exclude "graphify-out/" \
  --exclude "CLAUDE.md" \
  --exclude "AGENTS.md" \
  --exclude "RTK.md" \
  --exclude "skills-lock.json" \
  --exclude ".pack-denylist" \
  --exclude "scripts/pack-for-alignerr.sh" \
  --exclude ".env" \
  --exclude ".env.local" \
  --exclude ".env.*.local" \
  --exclude ".env.development" \
  --exclude ".env.production" \
  --exclude ".env.test" \
  --exclude ".DS_Store" \
  --exclude "*.log" \
  --exclude "*.tsbuildinfo" \
  --exclude "next-env.d.ts"

echo "Removing references to the excluded agent setup from the staged copy ..."
# README: the paragraph that introduces the Claude Code setup.
perl -0pi -e 's/\nThis repository is set up for \[Claude Code\].*?and hooks\.\n//s' "$STAGE/README.md"
# CONTRIBUTING: drop pointers to rule and skill files that are not in the upload.
perl -0pi -e 's/ \(see the table in\n\s*`\.claude\/rules\/40-tests\.md`\)//; s/ \(template in `\.claude\/skills\/adr\/SKILL\.md`\)//' \
  "$STAGE/CONTRIBUTING.md"
# .prettierignore: entries for the vendored skill packs.
perl -ni -e 'print unless /^(\.claude|\.agents|skills-lock\.json$|# Vendored)/' "$STAGE/.prettierignore"
# package.json: scripts that run files excluded above.
node -e '
  const fs = require("fs");
  const file = process.argv[1];
  const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
  delete pkg.scripts["hooks:test"];
  delete pkg.scripts["pack:alignerr"];
  fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");
' "$STAGE/package.json"

echo
echo "=== Structure checks ==="

# Every tracked source file must be staged, except the ones excluded on purpose.
missing="$(cd "$REPO_DIR" && git ls-files | grep -vE '^(\.claude/|\.agents/|CLAUDE\.md$|AGENTS\.md$|skills-lock\.json$|scripts/pack-for-alignerr\.sh$)' \
  | while IFS= read -r file; do [ -e "$STAGE/$file" ] || echo "$file"; done)"
[ -z "$missing" ] || fail "tracked files missing from the staged copy:
$missing"

for path in .git node_modules .claude .agents CLAUDE.md AGENTS.md; do
  if [ -n "$(find "$STAGE" -name "$path" -not -path "*/.github/*" -print -quit)" ]; then
    fail "'$path' is still in the staged copy"
  fi
done
if [ -n "$(find "$STAGE" -type d -name skills -print -quit)" ]; then
  fail "a 'skills' folder is still in the staged copy"
fi

if hits="$(grep -nE 'CLAUDE\.md|\.claude/(rules|skills|agents|hooks)|\.agents/skills|pack-for-alignerr|hooks:test' \
  "$STAGE/README.md" "$STAGE/CONTRIBUTING.md" "$STAGE/package.json" "$STAGE/.prettierignore")" && [ -n "$hits" ]; then
  fail "references to the excluded agent setup remain:
$hits"
fi

env_files="$(find "$STAGE" -name ".env*" -not -name ".env.example" -not -name ".env.template")"
[ -z "$env_files" ] || fail "real env files staged: $env_files"

if [ -f "$STAGE/.gitignore" ]; then
  for entry in node_modules dist .next coverage .turbo; do
    grep -q "^$entry" "$STAGE/.gitignore" || fail ".gitignore does not list '$entry'"
  done
else
  fail "no .gitignore at the root"
fi

echo
echo "=== Secret scan ==="
# Real-looking credentials. Obvious placeholders (sb_publishable_xxx,
# YOUR_API_KEY_HERE) do not match these shapes.
SECRET_PATTERNS=(
  '-----BEGIN [A-Z ]*PRIVATE KEY-----'
  'sb_secret_[A-Za-z0-9_-]{16,}'
  'sb_publishable_[A-Za-z0-9_-]{20,}'
  'eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'
  'AKIA[0-9A-Z]{16}'
  'gh[pousr]_[A-Za-z0-9]{36}'
  'sk-[A-Za-z0-9]{32,}'
  'sk-ant-[A-Za-z0-9_-]{20,}'
  'xox[abpr]-[A-Za-z0-9-]{10,}'
  'AIza[0-9A-Za-z_-]{35}'
  'postgres(ql)?://[^:/[:space:]]+:[^@[:space:]]{6,}@'
)
for pattern in "${SECRET_PATTERNS[@]}"; do
  if hits="$(grep -rnIE -e "$pattern" "$STAGE" | head -5)" && [ -n "$hits" ]; then
    fail "possible secret matching /$pattern/:"
    echo "$hits" | sed "s#$STAGE/#    #"
  fi
done

echo
echo "=== Personal data scan ==="
# Any email address that is not a documentation placeholder.
if hits="$(grep -rnIoE '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' "$STAGE" \
  | grep -viE '@(example\.(com|org|net)|anthropic\.com)' \
  | grep -viE '(noreply|no-reply)@' | head -5)" && [ -n "$hits" ]; then
  fail "email addresses found:"
  echo "$hits" | sed "s#$STAGE/#    #"
fi

# Terms that identify you, gathered at run time (never stored in the repo).
TERMS=()
add_term() { [ -n "${1:-}" ] && [ "${#1}" -ge 3 ] && TERMS+=("$1"); }
git_name="$(git -C "$REPO_DIR" config user.name 2>/dev/null || true)"
git_email="$(git -C "$REPO_DIR" config user.email 2>/dev/null || true)"
add_term "$git_name"
add_term "$git_email"
add_term "${git_email%@*}"
for word in $git_name; do add_term "$word"; done
origin="$(git -C "$REPO_DIR" remote get-url origin 2>/dev/null || true)"
owner="$(printf '%s' "$origin" | sed -nE 's#.*github\.com[:/]([^/]+)/.*#\1#p')"
add_term "$owner"
add_term "$(basename "$HOME")"
if [ -f "$REPO_DIR/.env" ]; then
  supabase_ref="$(sed -nE 's#^SUPABASE_URL=https://([a-z0-9]+)\.supabase\.co.*#\1#p' "$REPO_DIR/.env" | head -1)"
  add_term "$supabase_ref"
fi
if [ -f "$REPO_DIR/.pack-denylist" ]; then
  while IFS= read -r line; do add_term "$line"; done < "$REPO_DIR/.pack-denylist"
fi
for term in "${TERMS[@]}"; do
  if hits="$(grep -rnIiF -e "$term" "$STAGE" | head -3)" && [ -n "$hits" ]; then
    fail "personal term found (shown masked: ${term:0:2}***):"
    echo "$hits" | sed "s#$STAGE/#    #" | cut -c1-160
  fi
done
echo "  scanned for ${#TERMS[@]} personal terms"

echo
if [ "$FAILED" -ne 0 ]; then
  echo "Checks failed: no zip written. Fix the findings above and run again."
  exit 1
fi
echo "All checks passed. Staged size: $(du -sh "$STAGE" | cut -f1)"

echo
echo "=== Zipping ==="
rm -f "$OUT_ZIP"
(cd "$WORKDIR" && zip -rqX "$OUT_ZIP" "$NAME")
if unzip -l "$OUT_ZIP" | grep -qE '(^|/)\.git/'; then
  rm -f "$OUT_ZIP"
  echo "FAIL: .git/ found inside the zip"
  exit 1
fi
echo "OK: no .git/ entries; $(unzip -l "$OUT_ZIP" | tail -1 | awk '{print $2}') files"
echo
echo "Done: $OUT_ZIP"
