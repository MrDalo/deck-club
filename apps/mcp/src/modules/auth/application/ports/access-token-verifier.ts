import type { VerifiedPrincipal } from '../../domain/access-token-claims.js';

/**
 * Port: checks an access token's signature, expiry and claims.
 * Resolves null for a token that is missing, forged, expired or not a
 * Deck Club user's; rejects only when verification itself cannot run (the
 * authorization server's keys are unreachable), so that case is never
 * mistaken for a bad token.
 */
export type AccessTokenVerifier = {
  verify(token: string): Promise<VerifiedPrincipal | null>;
};

/** Nest injection token for {@link AccessTokenVerifier}. */
export const ACCESS_TOKEN_VERIFIER = Symbol('ACCESS_TOKEN_VERIFIER');
