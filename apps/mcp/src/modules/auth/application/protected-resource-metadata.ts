import {
  getOAuthProtectedResourceMetadataUrl,
  type OAuthProtectedResourceMetadata,
} from '@modelcontextprotocol/server';

/** What the protected resource metadata document describes. */
export type ProtectedResourceOptions = {
  /** The MCP endpoint's public URL: the resource identifier. */
  resource: URL;
  /** The authorization server's issuer identifier. */
  authorizationServer: string;
  /** Where people can read how to connect an AI client. */
  documentationUrl: URL;
};

/** Name shown by AI clients on their consent and connection screens. */
const RESOURCE_NAME = 'Deck Club';

/**
 * Builds the RFC 9728 Protected Resource Metadata an AI client reads after
 * the 401 challenge: which authorization server to sign the user in with.
 * `scopes_supported` is left out on purpose: Supabase issues only OpenID
 * scopes, and a client that requested Deck Club scopes from it would be
 * refused. Deck Club scopes are granted in Deck Club itself (see
 * `grantedScopes`).
 * @param options - the resource and its authorization server
 * @returns the metadata document
 */
export function buildProtectedResourceMetadata(
  options: ProtectedResourceOptions,
): OAuthProtectedResourceMetadata {
  return {
    resource: options.resource.href,
    authorization_servers: [options.authorizationServer],
    bearer_methods_supported: ['header'],
    resource_name: RESOURCE_NAME,
    resource_documentation: options.documentationUrl.href,
  };
}

/**
 * Where the metadata of an MCP endpoint lives (RFC 9728 §3.1, path-aware):
 * `https://host/mcp` → `https://host/.well-known/oauth-protected-resource/mcp`.
 * @param resource - the MCP endpoint's public URL
 * @returns the metadata URL advertised in every 401 challenge
 */
export function protectedResourceMetadataUrl(resource: URL): string {
  return getOAuthProtectedResourceMetadataUrl(resource);
}
