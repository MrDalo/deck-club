// PreToolUse Bash: no force push for anyone; subagents never run git commands
// that change the shared tree, index or history (rule 00-core).
import { readHookInput, block } from './read-hook-input.mjs';

const input = await readHookInput();
const command = String(input.tool_input?.command ?? '');
const isSubagent = typeof input.agent_type === 'string' && input.agent_type !== '';

if (/\bgit\s+push\b[^\n]*(\s--force\b|\s-f\b|\s--force-with-lease\b)/.test(command)) {
  block('bash-guard: force push is not allowed. Push normally, or ask the user.');
}

const TREE_CHANGING =
  /\bgit\s+(stash|checkout|restore|reset|clean|switch|add|commit|merge|rebase|cherry-pick|push|rm|mv)\b/;
if (isSubagent && TREE_CHANGING.test(command)) {
  block(
    'bash-guard: subagents never run git commands that change the shared tree (rule 00-core). Read the baseline with `git show HEAD:<path>` or report to the orchestrator.',
  );
}
process.exit(0);
