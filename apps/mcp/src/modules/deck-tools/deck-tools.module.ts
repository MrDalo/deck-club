import { Module } from '@nestjs/common';
import { ENV, type Env } from '../../config/env.js';
import { ClientNameRegistry } from './application/client-name-registry.js';
import { DeckToolsService } from './application/deck-tools.service.js';
import { DECK_CLUB_API } from './application/ports/deck-club-api.js';
import { McpController } from './http/mcp.controller.js';
import { HttpDeckClubApi } from './infrastructure/http-deck-club-api.js';

/** The deck tools exposed over MCP. Phase 1 adds study and stats tools as sibling modules. */
@Module({
  controllers: [McpController],
  providers: [
    DeckToolsService,
    { provide: ClientNameRegistry, useValue: new ClientNameRegistry() },
    {
      provide: DECK_CLUB_API,
      inject: [ENV],
      useFactory: (env: Env) => new HttpDeckClubApi(env.API_INTERNAL_URL),
    },
  ],
})
export class DeckToolsModule {}
