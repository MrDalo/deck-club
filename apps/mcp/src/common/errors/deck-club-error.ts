import type { ErrorCode, FieldIssue } from '@deck-club/contracts';

/**
 * The one refusal type of the MCP server: the core API said no, could not be
 * reached, a scope was not granted, or a capability is not built yet. It
 * carries a stable contracts code and a sentence an AI can relay to its user
 * as is. The MCP adapters turn it into `REJECTED: <CODE>. <detail>`.
 */
export class DeckClubError extends Error {
  /**
   * @param code - the contracts error code
   * @param detail - one human-readable sentence, never containing card content or a token
   * @param issues - field-level problems of a VALIDATION_FAILED, so the AI can fix its call
   */
  constructor(
    readonly code: ErrorCode,
    readonly detail: string,
    readonly issues: readonly FieldIssue[] = [],
  ) {
    super(`${code}: ${detail}`);
    this.name = 'DeckClubError';
  }
}

/**
 * How every refusal reads, for a tool result or a JSON-RPC error alike:
 * `REJECTED: <CODE>. <detail>`, then each field problem, so the AI can tell
 * the user or correct its own call.
 * @param error - the refusal
 * @returns the sentence the AI reads
 */
export function describeRefusal(error: DeckClubError): string {
  const base = `REJECTED: ${error.code}. ${error.detail}`;
  if (error.issues.length === 0) return base;
  const fields = error.issues.map(
    (issue) => `${issue.path === '' ? 'input' : issue.path}: ${issue.message}`,
  );
  return `${base} Fix: ${fields.join('; ')}.`;
}

/**
 * The body of every stubbed use case: the capability is part of the
 * published MCP interface, but its behaviour is not built yet.
 * @param capability - what the user asked for, e.g. the tool name `list_decks`
 * @returns a promise that always rejects with NOT_IMPLEMENTED
 */
export function notImplemented(capability: string): Promise<never> {
  return Promise.reject(
    new DeckClubError(
      'NOT_IMPLEMENTED',
      `${capability} is not available yet. Tell the user Deck Club is still building it.`,
    ),
  );
}
