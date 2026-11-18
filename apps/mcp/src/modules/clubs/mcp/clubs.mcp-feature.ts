import type { McpServer } from '@modelcontextprotocol/server';
import { Inject, Injectable } from '@nestjs/common';
import type { McpCaller } from '../../../common/mcp/mcp-caller.js';
import { McpFeature, type McpFeatureContributor } from '../../../common/mcp/mcp-feature.js';
import { registerTool } from '../../../common/mcp/tool-registration.js';
import { ClubsService } from '../application/clubs.service.js';
import { CLUB_TOOLS } from './club-tool-specs.js';

/** Driving adapter: publishes the club and battle tools over MCP. */
@McpFeature()
@Injectable()
export class ClubsMcpFeature implements McpFeatureContributor {
  constructor(@Inject(ClubsService) private readonly clubs: ClubsService) {}

  register(server: McpServer, caller: McpCaller): void {
    registerTool(server, caller, CLUB_TOOLS.listClubs, (input) =>
      this.clubs.listClubs(caller, input),
    );
    registerTool(server, caller, CLUB_TOOLS.suggestClubCards, (input) =>
      this.clubs.suggestClubCards(caller, input),
    );
    registerTool(server, caller, CLUB_TOOLS.createBattle, (input) =>
      this.clubs.createBattle(caller, input),
    );
  }
}
