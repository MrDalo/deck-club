import { Module } from '@nestjs/common';
import { DeckClubApiClient } from '../../infra/deck-club-api/deck-club-api-client.js';
import { DecksService } from './application/decks.service.js';
import { DECKS_API } from './application/ports/decks-api.js';
import { HttpDecksApi } from './infrastructure/http-decks-api.js';
import { DecksMcpFeature } from './mcp/decks.mcp-feature.js';

/** Decks and cards over MCP (spec 9): list, read, search, create, add, update and delete. */
@Module({
  providers: [
    DecksService,
    DecksMcpFeature,
    {
      provide: DECKS_API,
      inject: [DeckClubApiClient],
      useFactory: (api: DeckClubApiClient) => new HttpDecksApi(api),
    },
  ],
})
export class DecksModule {}
