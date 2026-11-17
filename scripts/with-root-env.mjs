// Runs a command with the repository-root `.env` loaded, for tools that fork
// workers and refuse `node --env-file` in NODE_OPTIONS (next dev). Variables
// already set in the environment win over the file.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const envFile = new URL('../.env', import.meta.url);
if (existsSync(envFile)) process.loadEnvFile(envFile);

const [command, ...args] = process.argv.slice(2);
if (command === undefined) {
  process.stderr.write('usage: node scripts/with-root-env.mjs <command> [...args]\n');
  process.exit(2);
}
const child = spawn(command, args, { stdio: 'inherit', env: process.env });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', (code, signal) => process.exit(code ?? (signal === null ? 1 : 0)));
