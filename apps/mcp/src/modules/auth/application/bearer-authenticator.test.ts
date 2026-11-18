import { MCP_SCOPES } from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import { DeckClubError } from '../../../common/errors/deck-club-error.js';
import { callerFromAuthInfo } from '../../../common/mcp/mcp-caller.js';
import { FakeAccessTokenVerifier } from '../testing/fake-access-token-verifier.js';
import { BearerAuthenticator } from './bearer-authenticator.js';

const METADATA_URL = 'http://localhost:4100/.well-known/oauth-protected-resource/mcp';
const IN_AN_HOUR = Math.floor(Date.now() / 1000) + 3600;

function authenticator(): { gate: BearerAuthenticator; verifier: FakeAccessTokenVerifier } {
  const verifier = new FakeAccessTokenVerifier();
  verifier.accept('token-ana', { userId: 'user-ana', clientId: 'claude', expiresAt: IN_AN_HOUR });
  return { gate: new BearerAuthenticator(verifier, METADATA_URL), verifier };
}

describe('BearerAuthenticator', () => {
  it('turns a valid token into the verified caller with its scopes', async () => {
    const { gate } = authenticator();

    const outcome = await gate.authenticate('Bearer token-ana');

    expect(outcome.authenticated).toBe(true);
    if (!outcome.authenticated) return;
    expect(callerFromAuthInfo(outcome.authInfo)).toMatchObject({
      accessToken: 'token-ana',
      userId: 'user-ana',
      clientId: 'claude',
      scopes: [...MCP_SCOPES],
    });
    expect(outcome.authInfo.resourceMetadataUrl).toBe(METADATA_URL);
  });

  it('challenges a request without a token and points to the resource metadata', async () => {
    const { gate } = authenticator();

    const outcome = await gate.authenticate(undefined);

    expect(outcome.authenticated).toBe(false);
    if (outcome.authenticated) return;
    expect(outcome.challenge.status).toBe(401);
    expect(outcome.challenge.headers.get('www-authenticate')).toContain(
      `resource_metadata="${METADATA_URL}"`,
    );
  });

  it('challenges an unknown or expired token as invalid_token', async () => {
    const { gate } = authenticator();

    const outcome = await gate.authenticate('Bearer forged');

    if (outcome.authenticated) throw new Error('expected a challenge');
    expect(outcome.challenge.status).toBe(401);
    expect(outcome.challenge.headers.get('www-authenticate')).toContain('error="invalid_token"');
  });

  it('challenges a header that is not a bearer token', async () => {
    const { gate } = authenticator();

    const outcome = await gate.authenticate('Basic dXNlcjpwYXNz');

    if (outcome.authenticated) throw new Error('expected a challenge');
    expect(outcome.challenge.status).toBe(401);
  });

  it('refuses a token whose expiry has passed even if the verifier accepted it', async () => {
    const { gate, verifier } = authenticator();
    verifier.accept('token-stale', { userId: 'user-ana', clientId: null, expiresAt: 1 });

    const outcome = await gate.authenticate('Bearer token-stale');

    if (outcome.authenticated) throw new Error('expected a challenge');
    expect(outcome.challenge.status).toBe(401);
  });

  it('answers 503 with Retry-After when the keys cannot be fetched, not 401', async () => {
    const { gate, verifier } = authenticator();
    verifier.failWith(
      new DeckClubError('UPSTREAM_UNAVAILABLE', 'Sign-in is not reachable right now.'),
    );

    const outcome = await gate.authenticate('Bearer token-ana');

    if (outcome.authenticated) throw new Error('expected a challenge');
    expect(outcome.challenge.status).toBe(503);
    expect(outcome.challenge.headers.get('retry-after')).toBe('5');
  });

  it('answers 500 when verification fails unexpectedly', async () => {
    const { gate, verifier } = authenticator();
    verifier.failWith(new Error('boom'));

    const outcome = await gate.authenticate('Bearer token-ana');

    if (outcome.authenticated) throw new Error('expected a challenge');
    expect(outcome.challenge.status).toBe(500);
    expect(await outcome.challenge.text()).not.toContain('boom');
  });
});
