// PreToolUse Edit|Write|MultiEdit: refuses to write a real secret into the
// repository, or dangerouslySetInnerHTML into the web app (rule 30-web).
// Patterns are assembled from parts so this file never matches itself.
import { readHookInput, block } from './read-hook-input.mjs';

const input = await readHookInput();
const toolInput = input.tool_input ?? {};
const filePath = String(toolInput.file_path ?? '');
const texts = [
  toolInput.content,
  toolInput.new_string,
  ...(toolInput.edits ?? []).map((edit) => edit.new_string),
]
  .filter((text) => typeof text === 'string')
  .join('\n');

// Local env files are where secrets belong; the settings deny Claude access to them anyway.
const isLocalEnvFile =
  /(^|\/)\.env(\.[\w-]+)?$/.test(filePath) && !filePath.endsWith('.env.example');
if (texts === '' || isLocalEnvFile) process.exit(0);

const PRIVATE = 'PRIVATE';
const checks = [
  { name: 'a private key', pattern: new RegExp(`-----BEGIN [A-Z ]*${PRIVATE} KEY-----`) },
  { name: 'a Supabase secret key', pattern: new RegExp(`sb_${'secret'}_[A-Za-z0-9_-]{16,}`) },
  // A JWT whose payload contains "service_role" (base64 of `service_role`).
  {
    name: 'a Supabase service-role JWT',
    pattern: new RegExp(`eyJ[\\w-]+\\.[\\w-]*${'c2VydmljZV9yb2xl'}[\\w-]*\\.[\\w-]+`),
  },
  { name: 'a GitHub token', pattern: new RegExp(`gh[pousr]_[A-Za-z0-9]{36}`) },
  { name: 'an AWS access key', pattern: new RegExp(`AKIA[0-9A-Z]{16}`) },
  {
    name: 'a connection string with a password',
    pattern: /postgres(ql)?:\/\/[^:\s/]+:[^@\s]{6,}@(?!localhost|127\.0\.0\.1|postgres[:/])/,
  },
];

for (const check of checks) {
  if (check.pattern.test(texts)) {
    block(
      `secret-guard: refusing to write ${check.name} into ${filePath}. Secrets belong in the git-ignored root .env or the deploy environment.`,
    );
  }
}

if (filePath.includes('apps/web/') && texts.includes('dangerously' + 'SetInnerHTML')) {
  block(
    'secret-guard: dangerouslySetInnerHTML is banned in apps/web (rule 30-web). Render card text as text.',
  );
}
process.exit(0);
