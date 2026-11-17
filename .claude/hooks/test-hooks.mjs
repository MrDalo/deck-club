// Regression cases for the hooks: `pnpm hooks:test`. Extend with every hook change.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const hook = (name) => fileURLToPath(new URL(`./${name}.mjs`, import.meta.url));
const SECRET = ['sb', 'secret', 'abcdefghijklmnopqrstuv'].join('_');
const HTML_PROP = 'dangerously' + 'SetInnerHTML';

const cases = [
  [
    'secret-guard',
    { tool_input: { file_path: 'apps/api/src/a.ts', content: `const key = '${SECRET}'` } },
    2,
  ],
  ['secret-guard', { tool_input: { file_path: '.env', content: `KEY=${SECRET}` } }, 0],
  [
    'secret-guard',
    { tool_input: { file_path: 'apps/web/src/a.tsx', new_string: `<p ${HTML_PROP}={x} />` } },
    2,
  ],
  [
    'secret-guard',
    { tool_input: { file_path: 'apps/web/src/a.tsx', content: '<p>{card.front}</p>' } },
    0,
  ],
  ['bash-guard', { tool_input: { command: 'git commit -m x' }, agent_type: 'tester' }, 2],
  [
    'bash-guard',
    { tool_input: { command: 'git show HEAD:package.json' }, agent_type: 'tester' },
    0,
  ],
  ['bash-guard', { tool_input: { command: 'git commit -m x' } }, 0],
  ['bash-guard', { tool_input: { command: 'git push --force origin master' } }, 2],
];

let failures = 0;
for (const [name, event, expected] of cases) {
  const result = spawnSync(process.execPath, [hook(name)], {
    input: JSON.stringify(event),
    encoding: 'utf8',
  });
  const passed = result.status === expected;
  if (!passed) failures += 1;
  process.stdout.write(
    `${passed ? 'ok  ' : 'FAIL'} ${name} → exit ${result.status} (expected ${expected})\n`,
  );
}
process.exit(failures === 0 ? 0 : 1);
