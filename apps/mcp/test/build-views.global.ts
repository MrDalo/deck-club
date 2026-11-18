import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

/**
 * Builds the MCP Apps view bundles once before the suite, so the tests that
 * read a view exercise the artifact `pnpm build` ships, not a stand-in.
 */
export default async function setup(): Promise<void> {
  await promisify(execFile)('node', ['--import', 'tsx', 'scripts/build-views.mjs'], {
    cwd: process.cwd(),
  });
}
