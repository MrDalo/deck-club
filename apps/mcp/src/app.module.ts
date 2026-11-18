import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module.js';
import { DeckClubApiModule } from './infra/deck-club-api/deck-club-api.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ClubsModule } from './modules/clubs/clubs.module.js';
import { DecksModule } from './modules/decks/decks.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { McpServerModule } from './modules/mcp-server/mcp-server.module.js';
import { StudyModule } from './modules/study/study.module.js';
import { WidgetsModule } from './modules/widgets/widgets.module.js';

/**
 * The MCP server: a stateless modular monolith and a thin client of the core
 * API (ADR 0004). Shared infrastructure first, then the platform modules
 * (health, OAuth, the MCP transport), then one module per slice of the MCP
 * surface; a feature module is served as soon as it is listed here.
 */
@Module({
  imports: [
    ConfigModule,
    DeckClubApiModule,
    HealthModule,
    AuthModule,
    McpServerModule,
    DecksModule,
    StudyModule,
    ClubsModule,
    WidgetsModule,
  ],
})
export class AppModule {}
