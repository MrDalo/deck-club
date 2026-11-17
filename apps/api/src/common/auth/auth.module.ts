import { Global, Module } from '@nestjs/common';
import { ENV, type Env } from '../../config/env.js';
import { ACCESS_TOKEN_VERIFIER } from './access-token-verifier.js';
import { AuthGuard } from './auth.guard.js';
import { SupabaseJwksVerifier } from './supabase-jwks-verifier.js';

/** Wires the Supabase verifier behind the {@link ACCESS_TOKEN_VERIFIER} port. Tests override the token. */
@Global()
@Module({
  providers: [
    {
      provide: ACCESS_TOKEN_VERIFIER,
      inject: [ENV],
      useFactory: (env: Env) => new SupabaseJwksVerifier(env.SUPABASE_URL),
    },
    AuthGuard,
  ],
  exports: [ACCESS_TOKEN_VERIFIER, AuthGuard],
})
export class AuthModule {}
