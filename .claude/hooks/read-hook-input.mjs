// Shared by every hook: reads the JSON event Claude Code writes to stdin.
// Any failure yields an empty object, so a broken hook never traps a session.
export async function readHookInput() {
  try {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    return {};
  }
}

/** Blocks the tool call (or the stop) and tells Claude why. */
export function block(reason) {
  process.stderr.write(`${reason}\n`);
  process.exit(2);
}
