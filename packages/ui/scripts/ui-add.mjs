// `pnpm ui:add <name…> [--overwrite]`: adds shadcn/ui primitives to src/ui
// through the shadcn CLI (components.json), then records them in ui-lock.json.
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeLock } from './ui-lock.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const UI_DIR = join(ROOT, 'src', 'ui');
const PACKAGE_JSON = join(ROOT, 'package.json');
// The `utils` alias points at our brand-aware cn(); an item that lists
// `utils` as a dependency must not replace it, even with --overwrite.
const UTILS = fileURLToPath(new URL('../src/lib/utils.ts', import.meta.url));
// The registry's primitives import `cn` from the `cn` package, which only
// knows Tailwind's default scales: `shadow-sticker` or `rounded-card` passed
// through `className` would not override the primitive's own class. Every
// primitive is pointed at the brand-aware cn() instead, and the package is
// not installed.
const REGISTRY_CN_IMPORT = /from (["'])cn\1/g;
const BRAND_CN_IMPORT = 'from "#lib/utils"';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: pnpm ui:add <name…> | --all [--overwrite]');
  process.exit(1);
}

/** Every .ts/.tsx file under src/ui, as absolute paths. */
function listUiSources() {
  return readdirSync(UI_DIR, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name))
    .map((entry) => join(entry.parentPath, entry.name));
}

/** Rewrites the registry's `cn` import to the brand-aware one; returns how many files changed. */
function useBrandCn() {
  let changed = 0;
  for (const file of listUiSources()) {
    const source = readFileSync(file, 'utf8');
    const rewritten = source.replace(REGISTRY_CN_IMPORT, BRAND_CN_IMPORT);
    if (rewritten !== source) {
      writeFileSync(file, rewritten);
      changed += 1;
    }
  }
  return changed;
}

/**
 * Undoes what the CLI's own install did to package.json: drops the `cn`
 * package and puts back the `catalog:` versions it replaced with pins, so
 * every version still comes from pnpm-workspace.yaml.
 */
function restoreManifest(before) {
  const manifest = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8'));
  const dependencies = manifest.dependencies ?? {};
  delete dependencies.cn;
  for (const [name, version] of Object.entries(before.dependencies ?? {})) {
    if (version === 'catalog:' && name in dependencies) dependencies[name] = 'catalog:';
  }
  const added = Object.keys(dependencies).filter(
    (name) => !(name in (before.dependencies ?? {})) && dependencies[name] !== 'catalog:',
  );
  writeFileSync(PACKAGE_JSON, `${JSON.stringify(manifest, null, 2)}\n`);
  if (added.length > 0) {
    console.log(
      `New dependencies pinned by the CLI; move them into the pnpm catalog: ${added.join(', ')}`,
    );
  }
}

const utils = readFileSync(UTILS, 'utf8');
const manifestBefore = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8'));
const result = spawnSync('shadcn', ['add', '--yes', ...args], {
  cwd: ROOT,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
if (readFileSync(UTILS, 'utf8') !== utils) {
  writeFileSync(UTILS, utils);
  console.log('Kept src/lib/utils.ts: the brand-aware cn() is not replaced by the CLI.');
}
const rewired = useBrandCn();
if (rewired > 0)
  console.log(`Pointed ${rewired} primitive(s) at the brand-aware cn() in #lib/utils.`);
restoreManifest(manifestBefore);
if (result.status !== 0) process.exit(result.status ?? 1);
writeLock();
console.log('Run `pnpm install` from the repository root to sync the lockfile.');
