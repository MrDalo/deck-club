import { describe, expect, it } from 'vitest';
import {
  callerFromAuthInfo,
  type McpCaller,
  SESSION_TOKEN_CLIENT_ID,
  toAuthInfo,
  UNKNOWN_CLIENT_NAME,
  withClientName,
} from './mcp-caller.js';

const CALLER: McpCaller = {
  accessToken: 'token-ana',
  userId: 'user-ana',
  clientId: 'oauth-client-claude',
  clientName: 'Claude',
  scopes: ['decks:read', 'study'],
};

describe('toAuthInfo and callerFromAuthInfo', () => {
  it('round-trip a caller through the SDK auth info', () => {
    expect(callerFromAuthInfo(toAuthInfo(CALLER, 1_900_000_000))).toEqual(CALLER);
  });

  it('marks a pasted session token with the session client id', () => {
    const authInfo = toAuthInfo({ ...CALLER, clientId: null }, 1_900_000_000);

    expect(authInfo.clientId).toBe(SESSION_TOKEN_CLIENT_ID);
    expect(callerFromAuthInfo(authInfo).clientId).toBeNull();
  });

  it('keeps the token expiry for the SDK’s expiry check', () => {
    expect(toAuthInfo(CALLER, 1_900_000_000).expiresAt).toBe(1_900_000_000);
  });
});

describe('withClientName', () => {
  it('names the AI client without touching the rest of the auth info', () => {
    const named = withClientName(toAuthInfo({ ...CALLER, clientName: '' }, 1), 'Codex');

    expect(callerFromAuthInfo(named)).toMatchObject({ userId: 'user-ana', clientName: 'Codex' });
  });
});

describe('callerFromAuthInfo', () => {
  it('refuses a request that skipped the auth gate', () => {
    expect(() => callerFromAuthInfo(undefined)).toThrow(/verified caller/);
  });

  it('refuses auth info without a user id', () => {
    expect(() =>
      callerFromAuthInfo({ token: 't', clientId: 'c', scopes: [], extra: { userId: '' } }),
    ).toThrow(/verified caller/);
  });

  it('falls back to a neutral client name', () => {
    const caller = callerFromAuthInfo({
      token: 't',
      clientId: 'c',
      scopes: [],
      extra: { userId: 'u' },
    });

    expect(caller.clientName).toBe(UNKNOWN_CLIENT_NAME);
  });

  it('drops scopes Deck Club does not know', () => {
    const caller = callerFromAuthInfo({
      token: 't',
      clientId: 'c',
      scopes: ['openid', 'clubs', 'email'],
      extra: { userId: 'u' },
    });

    expect(caller.scopes).toEqual(['clubs']);
  });
});
