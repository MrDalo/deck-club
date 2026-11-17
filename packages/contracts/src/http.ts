/**
 * Header the MCP server sets on every API call it forwards, naming the AI
 * client (from the MCP `initialize` handshake) so cards record provenance
 * such as "Added by Claude". Absent on calls from the web app.
 */
export const CLIENT_NAME_HEADER = 'x-deck-club-client';

/** Longest client name the API stores; longer values are cut, not rejected. */
export const CLIENT_NAME_MAX_LENGTH = 64;

/**
 * Reads a bearer token from an Authorization header. Shared by the API and
 * the MCP server so both accept exactly the same header forms.
 * @param header - the raw header value
 * @returns the token, or null when the header is absent or not a bearer
 */
export function parseBearerToken(header: string | undefined): string | null {
  if (header === undefined) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match?.[1] ?? null;
}
