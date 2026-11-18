import type { AuthorizationServerMetadata } from '@deck-club/contracts';
import { DeckClubError } from '../../../common/errors/deck-club-error.js';
import type { AuthorizationServer } from '../application/ports/authorization-server.js';

/** Issuer of the fake project used across MCP tests. */
export const FAKE_ISSUER = 'https://test-project.supabase.co/auth/v1';

/** RFC 8414 metadata shaped like Supabase's OAuth 2.1 server's. */
export const FAKE_AUTHORIZATION_SERVER_METADATA: AuthorizationServerMetadata = {
  issuer: FAKE_ISSUER,
  authorization_endpoint: `${FAKE_ISSUER}/oauth/authorize`,
  token_endpoint: `${FAKE_ISSUER}/oauth/token`,
  registration_endpoint: `${FAKE_ISSUER}/oauth/clients/register`,
  jwks_uri: `${FAKE_ISSUER}/.well-known/jwks.json`,
  response_types_supported: ['code'],
  code_challenge_methods_supported: ['S256'],
};

/** In-memory {@link AuthorizationServer} that can be switched off. */
export class FakeAuthorizationServer implements AuthorizationServer {
  readonly issuer = FAKE_ISSUER;
  private reachable = true;

  /** Simulates Supabase being down or the OAuth server being disabled. */
  goOffline(): void {
    this.reachable = false;
  }

  metadata(): Promise<AuthorizationServerMetadata> {
    if (!this.reachable)
      return Promise.reject(
        new DeckClubError('UPSTREAM_UNAVAILABLE', 'Supabase Auth is not reachable.'),
      );
    return Promise.resolve(FAKE_AUTHORIZATION_SERVER_METADATA);
  }
}
