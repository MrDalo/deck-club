import { Global, Module } from '@nestjs/common';
import { ENV, type Env } from '../../config/env.js';
import { DeckClubApiClient } from './deck-club-api-client.js';

/**
 * Provides the {@link DeckClubApiClient} to every module. Feature modules
 * wrap it in their own port adapters; tests override the provider.
 */
@Global()
@Module({
  providers: [
    {
      provide: DeckClubApiClient,
      inject: [ENV],
      useFactory: (env: Env) => new DeckClubApiClient(env.API_INTERNAL_URL),
    },
  ],
  exports: [DeckClubApiClient],
})
export class DeckClubApiModule {}
