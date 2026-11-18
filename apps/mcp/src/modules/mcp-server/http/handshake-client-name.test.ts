import { describe, expect, it } from 'vitest';
import { handshakeClientName } from './handshake-client-name.js';

describe('handshakeClientName', () => {
  it('reads the per-request envelope of a 2026-07-28 request', () => {
    const body = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'list_decks',
        _meta: { 'io.modelcontextprotocol/clientInfo': { name: 'claude-ai', version: '1' } },
      },
    };

    expect(handshakeClientName(body)).toBe('claude-ai');
  });

  it('reads the initialize handshake of a 2025-era client', () => {
    const body = {
      jsonrpc: '2.0',
      id: 0,
      method: 'initialize',
      params: {
        protocolVersion: '2025-11-25',
        clientInfo: { name: 'codex-mcp-client', version: '0.1' },
      },
    };

    expect(handshakeClientName(body)).toBe('codex-mcp-client');
  });

  it('finds nothing in a later stateless 2025-era request', () => {
    expect(handshakeClientName({ jsonrpc: '2.0', id: 2, method: 'tools/list' })).toBeUndefined();
  });

  it('ignores a blank name', () => {
    expect(handshakeClientName({ params: { clientInfo: { name: '  ' } } })).toBeUndefined();
  });

  it('ignores JSON-RPC batches and bodies that are not objects', () => {
    expect(handshakeClientName([{ params: { clientInfo: { name: 'x' } } }])).toBeUndefined();
    expect(handshakeClientName('initialize')).toBeUndefined();
    expect(handshakeClientName(undefined)).toBeUndefined();
  });
});
