import { AuthApiError, AuthInvalidJwtError, AuthRetryableFetchError } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import {
  type ClaimsReader,
  SupabaseAccessTokenVerifier,
} from './supabase-access-token-verifier.js';

const ISSUER = 'https://ref.supabase.co/auth/v1';
const CLAIMS = {
  iss: ISSUER,
  aud: 'authenticated',
  sub: '11111111-1111-4111-8111-111111111111',
  exp: 1_900_000_000,
  role: 'authenticated',
  client_id: 'claude-client',
};

function readerReturning(result: Awaited<ReturnType<ClaimsReader['getClaims']>>): ClaimsReader {
  return { getClaims: () => Promise.resolve(result) };
}

describe('SupabaseAccessTokenVerifier', () => {
  it('returns the principal of a token Supabase verified', async () => {
    const verifier = new SupabaseAccessTokenVerifier(
      readerReturning({ data: { claims: CLAIMS }, error: null }),
      ISSUER,
    );

    await expect(verifier.verify('token')).resolves.toEqual({
      userId: CLAIMS.sub,
      clientId: 'claude-client',
      expiresAt: CLAIMS.exp,
    });
  });

  it('refuses a token Supabase says is forged or expired', async () => {
    const verifier = new SupabaseAccessTokenVerifier(
      readerReturning({ data: null, error: new AuthInvalidJwtError('Invalid JWT signature') }),
      ISSUER,
    );

    await expect(verifier.verify('token')).resolves.toBeNull();
  });

  it('refuses a token Supabase Auth rejects for its user (shared-secret projects)', async () => {
    const verifier = new SupabaseAccessTokenVerifier(
      readerReturning({ data: null, error: new AuthApiError('invalid JWT', 403, 'bad_jwt') }),
      ISSUER,
    );

    await expect(verifier.verify('token')).resolves.toBeNull();
  });

  it('refuses a validly signed token whose claims are not a Deck Club user’s', async () => {
    const verifier = new SupabaseAccessTokenVerifier(
      readerReturning({ data: { claims: { ...CLAIMS, role: 'anon' } }, error: null }),
      ISSUER,
    );

    await expect(verifier.verify('token')).resolves.toBeNull();
  });

  it('refuses when Supabase returns neither claims nor an error', async () => {
    const verifier = new SupabaseAccessTokenVerifier(
      readerReturning({ data: null, error: null }),
      ISSUER,
    );

    await expect(verifier.verify('token')).resolves.toBeNull();
  });

  it('reports an outage instead of refusing the token when the keys are unreachable', async () => {
    const verifier = new SupabaseAccessTokenVerifier(
      readerReturning({ data: null, error: new AuthRetryableFetchError('fetch failed', 0) }),
      ISSUER,
    );

    await expect(verifier.verify('token')).rejects.toMatchObject({ code: 'UPSTREAM_UNAVAILABLE' });
  });

  it('reports an outage when Supabase Auth answers with a server error', async () => {
    const verifier = new SupabaseAccessTokenVerifier(
      readerReturning({ data: null, error: new AuthApiError('upstream', 502, undefined) }),
      ISSUER,
    );

    await expect(verifier.verify('token')).rejects.toMatchObject({ code: 'UPSTREAM_UNAVAILABLE' });
  });
});
