import { Module } from '@nestjs/common';
import { AuthModule } from './common/auth/auth.module.js';
import { IdempotencyModule } from './common/idempotency/idempotency.module.js';
import { ConfigModule } from './config/config.module.js';
import { DatabaseModule } from './infra/database/database.module.js';
import { DecksModule } from './modules/decks/decks.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { StudyModule } from './modules/study/study.module.js';

/** The modular monolith: shared infrastructure first, then one import per business module. */
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    IdempotencyModule,
    HealthModule,
    DecksModule,
    StudyModule,
  ],
})
export class AppModule {}
