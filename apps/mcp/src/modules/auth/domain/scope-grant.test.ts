import { MCP_SCOPES } from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import { grantedScopes } from './scope-grant.js';

describe('grantedScopes', () => {
  it('grants every Deck Club scope to a verified user until AI connections store grants', () => {
    const scopes = grantedScopes({ userId: 'user-ana', clientId: 'claude', expiresAt: 1 });

    expect(scopes).toEqual([...MCP_SCOPES]);
  });

  it('returns a copy, so a caller cannot change the catalogue', () => {
    const scopes = grantedScopes({ userId: 'user-ana', clientId: null, expiresAt: 1 });
    scopes.pop();

    expect(grantedScopes({ userId: 'user-ana', clientId: null, expiresAt: 1 })).toHaveLength(
      MCP_SCOPES.length,
    );
  });
});
