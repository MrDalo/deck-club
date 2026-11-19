import { Module } from '@nestjs/common';
import { DeckClubApiClient } from '../../infra/deck-club-api/deck-club-api-client.js';
import { ClubsService } from './application/clubs.service.js';
import { CLUBS_API } from './application/ports/clubs-api.js';
import { HttpClubsApi } from './infrastructure/http-clubs-api.js';
import { ClubsMcpFeature } from './mcp/clubs.mcp-feature.js';

/** Clubs and live battles over MCP (spec 7, 8, 9): list clubs, suggest cards, create a battle. */
@Module({
  providers: [
    ClubsService,
    ClubsMcpFeature,
    {
      provide: CLUBS_API,
      inject: [DeckClubApiClient],
      useFactory: (api: DeckClubApiClient) => new HttpClubsApi(api),
    },
  ],
})
export class ClubsModule {}
