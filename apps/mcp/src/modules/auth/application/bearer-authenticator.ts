import {
  type AuthInfo,
  bearerAuthChallengeResponse,
  OAuthError,
  OAuthErrorCode,
  type OAuthTokenVerifier,
  verifyBearerToken,
} from '@modelcontextprotocol/server';
import { DeckClubError } from '../../../common/errors/deck-club-error.js';
import { toAuthInfo } from '../../../common/mcp/mcp-caller.js';
import { grantedScopes } from '../domain/scope-grant.js';
import type { AccessTokenVerifier } from './ports/access-token-verifier.js';

/** How long a client should wait before retrying when verification could not run. */
const RETRY_AFTER_SECONDS = 5;

/** The result of checking a request's credentials. */
export type AuthOutcome =
  { authenticated: true; authInfo: AuthInfo } | { authenticated: false; challenge: Response };

/**
 * The MCP authorization gate (OAuth 2.1 resource server, MCP authorization
 * spec). A request without a valid bearer token is answered 401 with a
 * `WWW-Authenticate: Bearer … resource_metadata="…"` challenge: that header
 * is how an AI client discovers the protected resource metadata, then
 * Supabase as the authorization server, and starts the sign-in flow.
 */
export class BearerAuthenticator {
  private readonly sdkVerifier: OAuthTokenVerifier;

  /**
   * @param verifier - checks the token against the authorization server
   * @param resourceMetadataUrl - where this server's RFC 9728 metadata lives
   */
  constructor(
    verifier: AccessTokenVerifier,
    private readonly resourceMetadataUrl: string,
  ) {
    this.sdkVerifier = {
      verifyAccessToken: async (token) => {
        const principal = await verifier.verify(token);
        if (principal === null)
          throw new OAuthError(
            OAuthErrorCode.InvalidToken,
            'The access token is invalid or has expired.',
          );
        const caller = {
          accessToken: token,
          userId: principal.userId,
          clientId: principal.clientId,
          clientName: '',
          scopes: grantedScopes(principal),
        };
        return toAuthInfo(caller, principal.expiresAt);
      },
    };
  }

  /**
   * Checks the `Authorization` header of one request.
   * @param authorization - the raw header value
   * @returns the verified auth info, or the challenge response to send
   */
  async authenticate(authorization: string | undefined): Promise<AuthOutcome> {
    try {
      const authInfo = await verifyBearerToken(authorization, {
        verifier: this.sdkVerifier,
        resourceMetadataUrl: this.resourceMetadataUrl,
      });
      return { authenticated: true, authInfo };
    } catch (error) {
      if (error instanceof DeckClubError)
        return { authenticated: false, challenge: unavailable(error) };
      const challenge = bearerAuthChallengeResponse(error, {
        resourceMetadataUrl: this.resourceMetadataUrl,
      });
      return { authenticated: false, challenge };
    }
  }
}

/** Verification could not run (keys unreachable): a retryable 503, not a bad token. */
function unavailable(error: DeckClubError): Response {
  return Response.json(
    { error: 'temporarily_unavailable', error_description: error.detail },
    { status: 503, headers: { 'retry-after': String(RETRY_AFTER_SECONDS) } },
  );
}
