import { Module } from '@nestjs/common';
import { ClubsService } from './application/clubs.service.js';
import { ClubsMcpFeature } from './mcp/clubs.mcp-feature.js';

/** Clubs and live battles over MCP (spec 7, 8, 9): list clubs, suggest cards, create a battle. */
@Module({ providers: [ClubsService, ClubsMcpFeature] })
export class ClubsModule {}
