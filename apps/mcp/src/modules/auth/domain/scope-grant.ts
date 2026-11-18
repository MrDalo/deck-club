import { MCP_SCOPES, type McpScope } from '@deck-club/contracts';
import type { VerifiedPrincipal } from './access-token-claims.js';

/**
 * The Deck Club scopes (spec 9) a verified principal holds.
 *
 * Supabase's OAuth server issues only OpenID scopes, so Deck Club scopes are
 * not carried by the token: they are a grant the user makes in Deck Club,
 * per AI connection. Until AI connections (Settings, spec 5) store those
 * grants, every verified user token holds every scope. This function is the
 * single seam that changes when they do; tools already enforce the result.
 * @param _principal - the verified user and AI connection
 * @returns the granted scopes
 */
export function grantedScopes(_principal: VerifiedPrincipal): McpScope[] {
  return [...MCP_SCOPES];
}
