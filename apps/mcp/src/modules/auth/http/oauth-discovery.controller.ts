import { Controller, Get, Header, Inject, ServiceUnavailableException } from '@nestjs/common';
import type { AuthorizationServerMetadata } from '@deck-club/contracts';
import type { OAuthProtectedResourceMetadata } from '@modelcontextprotocol/server';
import { DeckClubError } from '../../../common/errors/deck-club-error.js';
import { ENV, type Env } from '../../../config/env.js';
import {
  AUTHORIZATION_SERVER,
  type AuthorizationServer,
} from '../application/ports/authorization-server.js';
import { buildProtectedResourceMetadata } from '../application/protected-resource-metadata.js';

/**
 * OAuth discovery for AI clients (MCP authorization spec). Public, and
 * readable cross-origin so browser-based clients such as the MCP Inspector
 * can discover the authorization server too.
 */
@Controller('.well-known')
export class OAuthDiscoveryController {
  private readonly protectedResource: OAuthProtectedResourceMetadata;

  constructor(
    @Inject(ENV) env: Env,
    @Inject(AUTHORIZATION_SERVER) private readonly authorizationServer: AuthorizationServer,
  ) {
    this.protectedResource = buildProtectedResourceMetadata({
      resource: new URL(env.MCP_PUBLIC_URL),
      authorizationServer: authorizationServer.issuer,
      documentationUrl: new URL('/connect-ai', env.WEB_PUBLIC_URL),
    });
  }

  /**
   * RFC 9728 Protected Resource Metadata, at the path-aware URL every 401
   * challenge names (`/.well-known/oauth-protected-resource/mcp`) and at the
   * bare URL clients probe when they got no challenge.
   */
  @Get(['oauth-protected-resource', 'oauth-protected-resource/*'])
  @Header('access-control-allow-origin', '*')
  @Header('cache-control', 'public, max-age=3600')
  protectedResourceMetadata(): OAuthProtectedResourceMetadata {
    return this.protectedResource;
  }

  /**
   * Supabase's RFC 8414 metadata relayed verbatim, for clients of the
   * 2025-03-26 revision that look for it on the MCP server's own origin.
   */
  @Get('oauth-authorization-server')
  @Header('access-control-allow-origin', '*')
  @Header('cache-control', 'public, max-age=600')
  async authorizationServerMetadata(): Promise<AuthorizationServerMetadata> {
    try {
      return await this.authorizationServer.metadata();
    } catch (error) {
      if (error instanceof DeckClubError) throw new ServiceUnavailableException(error.detail);
      throw error;
    }
  }
}
