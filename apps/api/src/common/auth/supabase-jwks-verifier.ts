import { createRemoteJWKSet, errors, jwtVerify } from 'jose';
import type { AccessTokenVerifier, AuthenticatedUser } from './access-token-verifier.js';

/** Supabase signs user access tokens for this audience. */
const SUPABASE_AUDIENCE = 'authenticated';

/** Outbound timeout for fetching the signing keys (rule 20-backend: no infinite waits). */
const JWKS_TIMEOUT_MS = 5_000;

/**
 * Adapter: verifies Supabase access tokens against the project's published
 * signing keys (asymmetric JWT signing keys, no shared secret on our side).
 * jose caches the key set and refetches it when it meets an unknown `kid`.
 */
export class SupabaseJwksVerifier implements AccessTokenVerifier {
  private readonly keySet: ReturnType<typeof createRemoteJWKSet>;
  private readonly issuer: string;

  /** @param supabaseUrl - the project URL, e.g. https://abc.supabase.co */
  constructor(supabaseUrl: string) {
    const base = supabaseUrl.replace(/\/+$/, '');
    this.issuer = `${base}/auth/v1`;
    this.keySet = createRemoteJWKSet(new URL(`${this.issuer}/.well-known/jwks.json`), {
      timeoutDuration: JWKS_TIMEOUT_MS,
    });
  }

  async verify(token: string): Promise<AuthenticatedUser | null> {
    try {
      const { payload } = await jwtVerify(token, this.keySet, {
        issuer: this.issuer,
        audience: SUPABASE_AUDIENCE,
      });
      if (typeof payload.sub !== 'string' || payload.sub === '') return null;
      return { id: payload.sub };
    } catch (error) {
      if (error instanceof errors.JOSEError && !(error instanceof errors.JWKSTimeout)) return null;
      throw error;
    }
  }
}
