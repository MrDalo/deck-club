import { CLIENT_NAME_HEADER } from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import { provenanceFromHeaders } from './provenance.js';

describe('provenanceFromHeaders', () => {
  it('is the app when the client header is absent', () => {
    expect(provenanceFromHeaders({})).toEqual({ source: 'app', clientName: null });
  });

  it('is the named AI client when the MCP server sets the header', () => {
    expect(provenanceFromHeaders({ [CLIENT_NAME_HEADER]: ' Claude ' })).toEqual({
      source: 'mcp',
      clientName: 'Claude',
    });
  });

  it('treats a blank header as the app', () => {
    expect(provenanceFromHeaders({ [CLIENT_NAME_HEADER]: '   ' }).source).toBe('app');
  });

  it('cuts an overlong client name instead of rejecting the write', () => {
    expect(
      provenanceFromHeaders({ [CLIENT_NAME_HEADER]: 'x'.repeat(200) }).clientName,
    ).toHaveLength(64);
  });
});
