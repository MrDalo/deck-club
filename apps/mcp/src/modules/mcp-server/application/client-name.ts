import { CLIENT_NAME_MAX_LENGTH } from '@deck-club/contracts';
import { UNKNOWN_CLIENT_NAME } from '../../../common/mcp/mcp-caller.js';

/** Product tokens AI clients send, mapped to the name shown on a card's "Added by" badge. */
const KNOWN_CLIENTS: readonly { pattern: RegExp; name: string }[] = [
  { pattern: /claude/i, name: 'Claude' },
  { pattern: /codex/i, name: 'Codex' },
  { pattern: /openai|chatgpt/i, name: 'ChatGPT' },
  { pattern: /cursor/i, name: 'Cursor' },
];

/**
 * Names the AI client for card provenance. Prefers the name the client
 * gives in the MCP handshake (`clientInfo`), then the User-Agent. Once AI
 * connections store the OAuth client's registered name, that wins.
 * @param handshakeName - `clientInfo.name` when known
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
