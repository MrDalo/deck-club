import { CLIENT_NAME_MAX_LENGTH } from '@deck-club/contracts';

/** Product tokens AI clients send, mapped to the name shown on a card's "Added by" badge. */
const KNOWN_CLIENTS: readonly { pattern: RegExp; name: string }[] = [
  { pattern: /claude/i, name: 'Claude' },
  { pattern: /codex/i, name: 'Codex' },
  { pattern: /openai|chatgpt/i, name: 'ChatGPT' },
  { pattern: /cursor/i, name: 'Cursor' },
];

/** Shown when the client cannot be recognised. */
export const UNKNOWN_CLIENT_NAME = 'AI assistant';

/**
 * Names the AI client for card provenance. Prefers the name from the MCP
 * `initialize` handshake, then the User-Agent. Once OAuth lands, the
 * registered client name of the AI connection replaces both.
 * @param handshakeName - `clientInfo.name` when the request carried it
 * @param userAgent - the User-Agent header
 * @returns a short display name, never empty
 */
export function resolveClientName(
  handshakeName: string | undefined,
  userAgent: string | undefined,
): string {
  for (const candidate of [handshakeName, userAgent]) {
    if (candidate === undefined || candidate.trim() === '') continue;
    const known = KNOWN_CLIENTS.find((client) => client.pattern.test(candidate));
    if (known !== undefined) return known.name;
  }
  const handshake = handshakeName?.trim() ?? '';
  return handshake === '' ? UNKNOWN_CLIENT_NAME : handshake.slice(0, CLIENT_NAME_MAX_LENGTH);
}
