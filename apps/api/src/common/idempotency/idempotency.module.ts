import { Global, Module } from '@nestjs/common';
import { randomIds, systemClock, TIME_AND_IDS } from '../time-and-ids.js';
import { DrizzleIdempotencyStore } from './drizzle-idempotency.store.js';
import { IdempotencyInterceptor } from './idempotency.interceptor.js';
import { IdempotencyService } from './idempotency.service.js';
import { IDEMPOTENCY_STORE } from './idempotency-store.js';

/**
 * Idempotency keys for API writes, on SQLite. Global, like auth: any
 * module's write route opts in with `@Idempotent()`.
 */
@Global()
@Module({
  providers: [
    IdempotencyService,
    IdempotencyInterceptor,
    { provide: IDEMPOTENCY_STORE, useClass: DrizzleIdempotencyStore },
    { provide: TIME_AND_IDS, useValue: { clock: systemClock, ids: randomIds } },
  ],
  exports: [IdempotencyService, IdempotencyInterceptor],
})
export class IdempotencyModule {}
