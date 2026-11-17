/** The signed-in person behind a request. `id` is the Supabase user id (JWT `sub`). */
export type AuthenticatedUser = {
  id: string;
};

/**
 * Port: turns a bearer token into a user, or null when the token is missing,
 * expired, forged or issued for another project. Never throws for a bad
 * token; throws only when verification itself cannot run (JWKS unreachable).
 */
export type AccessTokenVerifier = {
  verify(token: string): Promise<AuthenticatedUser | null>;
};

/** Nest injection token for {@link AccessTokenVerifier}. */
export const ACCESS_TOKEN_VERIFIER = Symbol('ACCESS_TOKEN_VERIFIER');
