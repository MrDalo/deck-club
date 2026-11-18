import { z } from 'zod';

/**
 * RFC 8414 Authorization Server Metadata: the fields the MCP server relies on.
 * Unknown fields are kept so the document can be relayed verbatim to MCP
 * clients that look for it on the resource server's origin.
 */
export const AuthorizationServerMetadataSchema = z
  .object({
    issuer: z.url(),
    authorization_endpoint: z.url(),
    token_endpoint: z.url(),
    registration_endpoint: z.url().optional(),
    jwks_uri: z.url().optional(),
    scopes_supported: z.array(z.string()).optional(),
    response_types_supported: z.array(z.string()),
    code_challenge_methods_supported: z.array(z.string()).optional(),
  })
  .loose();
export type AuthorizationServerMetadata = z.infer<typeof AuthorizationServerMetadataSchema>;
