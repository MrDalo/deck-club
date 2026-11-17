import { CLIENT_NAME_HEADER, CLIENT_NAME_MAX_LENGTH, type Provenance } from '@deck-club/contracts';

/**
 * Derives who made a write from the request headers: the MCP server names
 * the AI client in {@link CLIENT_NAME_HEADER}; the web app never sets it.
 * @param headers - the incoming request headers
 * @returns `mcp` with the client name, or `app`
 */
export function provenanceFromHeaders(
  headers: Readonly<Record<string, string | string[] | undefined>>,
): Provenance {
  const raw = headers[CLIENT_NAME_HEADER];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const clientName = value?.trim().slice(0, CLIENT_NAME_MAX_LENGTH) ?? '';
  if (clientName === '') return { source: 'app', clientName: null };
  return { source: 'mcp', clientName };
}
