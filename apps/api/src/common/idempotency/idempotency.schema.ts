import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/** The states of a key: claimed by a running request, or holding its stored response. */
export const IDEMPOTENCY_KEY_STATES = ['in_progress', 'completed'] as const;

/**
 * Idempotency keys of API writes (product spec 9), per user: the request
 * that claimed each key and, once it succeeded, its response. Not business
 * data: rows are forgotten after a day (see `IDEMPOTENCY_POLICY`). The
 * primary key also serves the per-user purge of expired keys.
 */
export const idempotencyKeysTable = sqliteTable(
  'idempotency_keys',
  {
    userId: text('user_id').notNull(),
    key: text('key').notNull(),
    fingerprint: text('fingerprint').notNull(),
    reservationId: text('reservation_id').notNull(),
    state: text('state', { enum: IDEMPOTENCY_KEY_STATES }).notNull(),
    responseBody: text('response_body'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.key] })],
);
