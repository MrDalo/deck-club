// Stop: refuses to end the turn while `pnpm typecheck` fails (rule 00-core,
// "never leave the build red"). Skipped when the working tree is identical to
// the last green run, when dependencies are not installed, or on a re-entry.
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readHookInput, block } from './read-hook-input.mjs';

const input = await readHookInput();
const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
if (input.stop_hook_active === true || !existsSync(join(root, 'node_modules'))) process.exit(0);

const stateFile = join(root, '.claude/state/stop-gate.json');
let treeHash = '';
try {
  const status = execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' });
  const diff = execFileSync('git', ['diff', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  treeHash = createHash('sha256').update(status).update(diff).digest('hex');
  const last = JSON.parse(readFileSync(stateFile, 'utf8'));
  if (last.greenTreeHash === treeHash) process.exit(0);
} catch {
  // No cache yet, or git unavailable: fall through and run the check.
}

const result = spawnSync('pnpm', ['typecheck'], { cwd: root, encoding: 'utf8', timeout: 240_000 });
if (result.error) process.exit(0); // pnpm missing or timed out: do not trap the session.
if (result.status !== 0) {
  const tail = `${result.stdout}\n${result.stderr}`.trim().split('\n').slice(-25).join('\n');
  block(
    `stop-gate: pnpm typecheck fails. Fix it before ending the turn, or name the reason.\n${tail}`,
  );
}
try {
  mkdirSync(join(root, '.claude/state'), { recursive: true });
  writeFileSync(
    stateFile,
    JSON.stringify({ greenTreeHash: treeHash, at: new Date().toISOString() }),
  );
} catch {
  // Cache is an optimisation only.
}
process.exit(0);
