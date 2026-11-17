import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module.js';
import { DeckToolsModule } from './modules/deck-tools/deck-tools.module.js';
import { HealthModule } from './modules/health/health.module.js';

/** The MCP server: a thin, stateless client of the core API. */
@Module({
  imports: [ConfigModule, HealthModule, DeckToolsModule],
})
export class AppModule {}
