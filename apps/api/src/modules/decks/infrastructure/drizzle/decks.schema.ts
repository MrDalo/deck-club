import { CARD_SOURCES, CARD_TYPES, DECK_VISIBILITIES } from '@deck-club/contracts';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/** Decks. Owned by this module only; other modules go through DecksFacade (rule 25-data). */
export const decksTable = sqliteTable(
  'decks',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    language: text('language').notNull(),
    tags: text('tags', { mode: 'json' }).$type<string[]>().notNull(),
    visibility: text('visibility', { enum: DECK_VISIBILITIES }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
  },
  (table) => [index('decks_owner_id_idx').on(table.ownerId)],
);

/** Cards. `source` and `client_name` record provenance (product spec 3). */
export const cardsTable = sqliteTable(
  'cards',
  {
    id: text('id').primaryKey(),
    deckId: text('deck_id')
      .notNull()
      .references(() => decksTable.id),
    type: text('type', { enum: CARD_TYPES }).notNull(),
    front: text('front').notNull(),
    back: text('back').notNull(),
    extra: text('extra').notNull(),
    tags: text('tags', { mode: 'json' }).$type<string[]>().notNull(),
    source: text('source', { enum: CARD_SOURCES }).notNull(),
    clientName: text('client_name'),
    version: integer('version').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
  },
  (table) => [index('cards_deck_id_idx').on(table.deckId)],
);
