import { REVIEW_SOURCES, RATINGS, STUDY_DIRECTIONS, STUDY_STATES } from '@deck-club/contracts';
import { index, integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * One user's schedule for one card side. Owned by the study module; card ids
 * refer to the decks module's cards but carry no foreign key (rule 25-data:
 * no cross-module foreign keys). Columns mirror the FSRS memory one to one.
 */
export const studyStatesTable = sqliteTable(
  'study_states',
  {
    userId: text('user_id').notNull(),
    cardId: text('card_id').notNull(),
    direction: text('direction', { enum: STUDY_DIRECTIONS }).notNull(),
    deckId: text('deck_id').notNull(),
    state: text('state', { enum: STUDY_STATES }).notNull(),
    stability: real('stability').notNull(),
    stabilityFast: real('stability_fast').notNull(),
    difficulty: real('difficulty').notNull(),
    dueAt: integer('due_at', { mode: 'timestamp_ms' }).notNull(),
    lastReviewAt: integer('last_review_at', { mode: 'timestamp_ms' }),
    reps: integer('reps').notNull(),
    lapses: integer('lapses').notNull(),
    scheduledDays: real('scheduled_days').notNull(),
    learningStep: integer('learning_step').notNull(),
    suspended: integer('suspended', { mode: 'boolean' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.cardId, table.direction] }),
    index('study_states_user_due_idx').on(table.userId, table.dueAt),
  ],
);

/**
 * The review log: append-only (spec 3). Undo sets `undone_at`; nothing is
 * deleted. `previous_memory` is the JSON snapshot undo restores; it is never
 * queried by value, while `previous_state` is (retention, daily limits).
 */
export const reviewsTable = sqliteTable(
  'reviews',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    deckId: text('deck_id').notNull(),
    cardId: text('card_id').notNull(),
    direction: text('direction', { enum: STUDY_DIRECTIONS }).notNull(),
    rating: text('rating', { enum: RATINGS }).notNull(),
    source: text('source', { enum: REVIEW_SOURCES }).notNull(),
    clientName: text('client_name'),
    durationMs: integer('duration_ms'),
    reviewedAt: integer('reviewed_at', { mode: 'timestamp_ms' }).notNull(),
    previousState: text('previous_state', { enum: STUDY_STATES }),
    previousMemory: text('previous_memory'),
    undoneAt: integer('undone_at', { mode: 'timestamp_ms' }),
  },
  (table) => [index('reviews_user_reviewed_idx').on(table.userId, table.reviewedAt)],
);
