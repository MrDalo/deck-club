import type { AuthorizationServerMetadata } from '@deck-club/contracts';

/**
 * Port: the OAuth 2.1 authorization server AI clients sign users in with
 * (Supabase Auth). The MCP server is only the resource server: it points
 * clients here and verifies the tokens issued here.
 */
export type AuthorizationServer = {
  /** The issuer identifier, advertised in the protected resource metadata. */
  readonly issuer: string;
  /**
   * The server's RFC 8414 metadata.
   * @throws DeckClubError UPSTREAM_UNAVAILABLE when it cannot be fetched or is not usable
   */
  metadata(): Promise<AuthorizationServerMetadata>;
};

/** Nest injection token for {@link AuthorizationServer}. */
export const AUTHORIZATION_SERVER = Symbol('AUTHORIZATION_SERVER');
