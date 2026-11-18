import { CLIENT_INFO_META_KEY } from '@modelcontextprotocol/server';

const field = (value: unknown, key: string): unknown =>
  typeof value === 'object' && value !== null && !Array.isArray(value) && key in value
    ? (value as Record<string, unknown>)[key]
    : undefined;

const nonEmpty = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() !== '' ? value : undefined;

/**
 * Reads the AI client's self-reported name from a JSON-RPC request body.
 * A 2026-07-28 request carries it in every request's `_meta` envelope
 * (`io.modelcontextprotocol/clientInfo`); a 2025-era client sends it once,
 * in `initialize` (`params.clientInfo`).
 * @param body - the parsed JSON-RPC body
 * @returns the client's name, if this request carries it
 */
export function handshakeClientName(body: unknown): string | undefined {
  const params = field(body, 'params');
  const envelope = field(field(field(params, '_meta'), CLIENT_INFO_META_KEY), 'name');
  return nonEmpty(envelope) ?? nonEmpty(field(field(params, 'clientInfo'), 'name'));
}
