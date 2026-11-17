// SessionStart: a short orientation — branch, uncommitted work, last commits,
// and the status block of docs/roadmap.md. Exits 0 whatever happens.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const git = (...args) => {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
};

try {
  const lines = [
    `branch: ${git('rev-parse', '--abbrev-ref', 'HEAD') || 'unknown'}`,
    `uncommitted files: ${git('status', '--porcelain').split('\n').filter(Boolean).length}`,
    'last commits:',
    ...git('log', '--oneline', '-5')
      .split('\n')
      .map((line) => `  ${line}`),
  ];
  const roadmap = readFileSync(join(root, 'docs/roadmap.md'), 'utf8');
  const status = /<!-- status:start -->([\s\S]*?)<!-- status:end -->/.exec(roadmap)?.[1]?.trim();
  if (status) lines.push('', 'roadmap status:', status);
  process.stdout.write(`${lines.join('\n')}\n`);
} catch {
  // Orientation is a convenience; never fail the session over it.
}
process.exit(0);
