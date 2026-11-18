import { type AuthError, createClient, isAuthRetryableFetchError } from '@supabase/supabase-js';
import { Logger } from '@nestjs/common';
import { DeckClubError } from '../../../common/errors/deck-club-error.js';
import { checkAccessTokenClaims, type VerifiedPrincipal } from '../domain/access-token-claims.js';
import type { AccessTokenVerifier } from '../application/ports/access-token-verifier.js';

/** The slice of the Supabase Auth client the verifier uses. */
export type ClaimsReader = {
  getClaims(
    jwt: string,
  ): Promise<
    | { data: { claims: Readonly<Record<string, unknown>> }; error: null }
    | { data: null; error: AuthError | null }
  >;
};

/**
 * The Supabase Auth client for a server process: no session storage, no
 * token refresh timers, no URL parsing. It only verifies other people's
 * tokens.
 * @param supabaseUrl - the project URL
 * @param publishableKey - the project's publishable (anon) key
 * @returns the auth client
 */
export function createServerAuthClient(supabaseUrl: string, publishableKey: string): ClaimsReader {
  return createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  }).auth;
}

const isOutage = (error: AuthError): boolean =>
  isAuthRetryableFetchError(error) || (typeof error.status === 'number' && error.status >= 500);

/**
 * Adapter: verifies Supabase access tokens with the official client.
 * `auth.getClaims` checks the signature against the project's published
 * signing keys (cached, refetched for an unknown key id), or asks Supabase
 * Auth for projects still on a shared secret, and checks expiry; the domain
 * then checks issuer, audience and user. The same code accepts web session
 * tokens and the OAuth 2.1 tokens Supabase issues to AI clients.
 */
export class SupabaseAccessTokenVerifier implements AccessTokenVerifier {
  private readonly logger = new Logger('auth');

  /**
   * @param auth - the Supabase Auth client
   * @param issuer - this project's issuer, `<SUPABASE_URL>/auth/v1`
   */
  constructor(
    private readonly auth: ClaimsReader,
    private readonly issuer: string,
  ) {}

  async verify(token: string): Promise<VerifiedPrincipal | null> {
    const { data, error } = await this.auth.getClaims(token);
    if (error !== null && isOutage(error))
      throw new DeckClubError(
        'UPSTREAM_UNAVAILABLE',
        'Sign-in cannot be checked right now. Try again in a minute.',
      );
    if (data === null) return null;
    const verdict = checkAccessTokenClaims(data.claims, this.issuer);
    if (verdict.valid) return verdict.principal;
    this.logger.verbose({ evt: 'auth.token.refused', reason: verdict.reason });
    return null;
  }
}
