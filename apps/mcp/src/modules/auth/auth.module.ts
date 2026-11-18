import { Module } from '@nestjs/common';
import { ENV, type Env } from '../../config/env.js';
import { AuthFacade } from './auth.facade.js';
import { BearerAuthenticator } from './application/bearer-authenticator.js';
import {
  ACCESS_TOKEN_VERIFIER,
  type AccessTokenVerifier,
} from './application/ports/access-token-verifier.js';
import { AUTHORIZATION_SERVER } from './application/ports/authorization-server.js';
import { protectedResourceMetadataUrl } from './application/protected-resource-metadata.js';
import { supabaseIssuer } from './domain/access-token-claims.js';
import { OAuthDiscoveryController } from './http/oauth-discovery.controller.js';
import {
  createServerAuthClient,
  SupabaseAccessTokenVerifier,
} from './infrastructure/supabase-access-token-verifier.js';
import { SupabaseAuthorizationServer } from './infrastructure/supabase-authorization-server.js';
import { SupabaseAuthProbe } from './infrastructure/supabase-auth.probe.js';

/**
 * OAuth 2.1 for MCP with Supabase Auth as the authorization server: the MCP
 * server is the resource server. It publishes discovery metadata, verifies
 * bearer tokens and answers unauthenticated requests with the challenge
 * that starts an AI client's sign-in. Tests override the two ports.
 */
@Module({
  controllers: [OAuthDiscoveryController],
  providers: [
    {
      provide: AUTHORIZATION_SERVER,
      inject: [ENV],
      useFactory: (env: Env) => new SupabaseAuthorizationServer(supabaseIssuer(env.SUPABASE_URL)),
    },
    {
      provide: ACCESS_TOKEN_VERIFIER,
      inject: [ENV],
      useFactory: (env: Env) =>
        new SupabaseAccessTokenVerifier(
          createServerAuthClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY),
          supabaseIssuer(env.SUPABASE_URL),
        ),
    },
    {
      provide: BearerAuthenticator,
      inject: [ACCESS_TOKEN_VERIFIER, ENV],
      useFactory: (verifier: AccessTokenVerifier, env: Env) =>
        new BearerAuthenticator(
          verifier,
          protectedResourceMetadataUrl(new URL(env.MCP_PUBLIC_URL)),
        ),
    },
    SupabaseAuthProbe,
    AuthFacade,
  ],
  exports: [AuthFacade],
})
export class AuthModule {}
