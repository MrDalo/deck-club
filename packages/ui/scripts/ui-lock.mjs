// src/ui holds shadcn/ui primitives exactly as the shadcn CLI writes them.
// They are never edited by hand: branded behaviour and styling live in
// src/components/<name>. ui-lock.json records a hash of every vendored file;
// `--check` (part of `pnpm lint`) fails when src/ui drifts from it, and
// `--write` (run by `pnpm ui:add`) records what the CLI just wrote.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const UI_DIR = join(ROOT, 'src', 'ui');
const LOCK_FILE = join(ROOT, 'ui-lock.json');

/** Every file under src/ui, as sorted POSIX paths relative to it. */
function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && entry.name !== '.gitkeep')
    .map((entry) => relative(UI_DIR, join(entry.parentPath, entry.name)).split(sep).join('/'))
    .sort();
}

/** @returns {Record<string, string>} file path → sha256 of its contents */
export function hashUi() {
  return Object.fromEntries(
    listFiles(UI_DIR).map((file) => [
      file,
      createHash('sha256')
        .update(readFileSync(join(UI_DIR, file)))
        .digest('hex'),
    ]),
  );
}

/** Records the current contents of src/ui as the vendored baseline. */
export function writeLock() {
  const files = hashUi();
  const lock = {
    $comment:
      'Hashes of the shadcn/ui files in src/ui. Written by `pnpm ui:add` / `pnpm ui:lock`; never edit src/ui by hand.',
    files,
  };
  writeFileSync(LOCK_FILE, `${JSON.stringify(lock, null, 2)}\n`);
  console.log(`ui-lock.json: ${Object.keys(files).length} vendored files recorded.`);
}

/** @returns {string[]} one line per file that differs from ui-lock.json */
function findDrift() {
  const locked = JSON.parse(readFileSync(LOCK_FILE, 'utf8')).files;
  const current = hashUi();
  const drift = [];
  for (const [file, hash] of Object.entries(current)) {
    if (!(file in locked)) drift.push(`added     src/ui/${file}`);
    else if (locked[file] !== hash) drift.push(`modified  src/ui/${file}`);
  }
  for (const file of Object.keys(locked))
    if (!(file in current)) drift.push(`removed   src/ui/${file}`);
  return drift;
}

function check() {
  const drift = findDrift();
  if (drift.length === 0) return;
  console.error(
    [
      'src/ui differs from ui-lock.json:',
      ...drift.map((line) => `  ${line}`),
      '',
      'src/ui is vendored shadcn/ui code and is never edited by hand.',
      'Put the change in a branded component under src/components/<name> instead.',
      'If the shadcn CLI wrote these files (`pnpm ui:add <name>`), record them with `pnpm ui:lock`.',
    ].join('\n'),
  );
  process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2];
  if (mode === '--write') writeLock();
  else if (mode === '--check') check();
  else {
    console.error('Usage: node scripts/ui-lock.mjs --check | --write');
    process.exitCode = 1;
  }
}
