import { describe, expect, it } from 'vitest';
import { checkAccessTokenClaims, supabaseIssuer } from './access-token-claims.js';

const ISSUER = 'https://ref.supabase.co/auth/v1';
const SESSION_CLAIMS = {
  iss: ISSUER,
  aud: 'authenticated',
  sub: '11111111-1111-4111-8111-111111111111',
  exp: 1_900_000_000,
  role: 'authenticated',
  is_anonymous: false,
};

describe('checkAccessTokenClaims', () => {
  it('accepts a web session token as the user, with no AI connection', () => {
    expect(checkAccessTokenClaims(SESSION_CLAIMS, ISSUER)).toEqual({
      valid: true,
      principal: { userId: SESSION_CLAIMS.sub, clientId: null, expiresAt: 1_900_000_000 },
    });
  });

  it('names the AI connection of a token from the OAuth server', () => {
    const verdict = checkAccessTokenClaims(
      { ...SESSION_CLAIMS, client_id: 'claude-client' },
      ISSUER,
    );

    expect(verdict).toMatchObject({ valid: true, principal: { clientId: 'claude-client' } });
  });

  it('accepts an audience list that includes the user audience', () => {
    const verdict = checkAccessTokenClaims(
      { ...SESSION_CLAIMS, aud: ['authenticated', 'x'] },
      ISSUER,
    );

    expect(verdict.valid).toBe(true);
  });

  it('refuses a token from another Supabase project', () => {
    const claims = { ...SESSION_CLAIMS, iss: 'https://other.supabase.co/auth/v1' };

    expect(checkAccessTokenClaims(claims, ISSUER)).toEqual({
      valid: false,
      reason: 'wrong_issuer',
    });
  });

  it('refuses a token for another audience', () => {
    const claims = { ...SESSION_CLAIMS, aud: 'service' };

    expect(checkAccessTokenClaims(claims, ISSUER)).toEqual({
      valid: false,
      reason: 'wrong_audience',
    });
  });

  it('refuses a token without a subject', () => {
    const { sub: _omitted, ...claims } = SESSION_CLAIMS;

    expect(checkAccessTokenClaims(claims, ISSUER)).toEqual({
      valid: false,
      reason: 'missing_subject',
    });
  });

  it('refuses a token without an expiry', () => {
    const { exp: _omitted, ...claims } = SESSION_CLAIMS;

    expect(checkAccessTokenClaims(claims, ISSUER)).toEqual({
      valid: false,
      reason: 'missing_expiry',
    });
  });

  it('refuses the publishable key’s anon role', () => {
    const claims = { ...SESSION_CLAIMS, role: 'anon' };

    expect(checkAccessTokenClaims(claims, ISSUER)).toEqual({ valid: false, reason: 'not_a_user' });
  });

  it('refuses an anonymous guest, who keeps no decks (spec 10)', () => {
    const claims = { ...SESSION_CLAIMS, is_anonymous: true };

    expect(checkAccessTokenClaims(claims, ISSUER)).toEqual({
      valid: false,
      reason: 'anonymous_user',
    });
  });

  it('ignores an empty client id', () => {
    const verdict = checkAccessTokenClaims({ ...SESSION_CLAIMS, client_id: '' }, ISSUER);

    expect(verdict).toMatchObject({ valid: true, principal: { clientId: null } });
  });
});

describe('supabaseIssuer', () => {
  it('appends the Auth path to the project URL', () => {
    expect(supabaseIssuer('https://ref.supabase.co')).toBe(ISSUER);
  });

  it('tolerates a trailing slash', () => {
    expect(supabaseIssuer('https://ref.supabase.co//')).toBe(ISSUER);
  });
});
