import { CLUB_ROLES, CLUB_VISIBILITIES } from '@deck-club/contracts';
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

/** Clubs. Owned by this module only; other modules will go through a ClubsFacade (rule 25-data). */
export const clubsTable = sqliteTable(
  'clubs',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    visibility: text('visibility', { enum: CLUB_VISIBILITIES }).notNull(),
    inviteCode: text('invite_code').notNull(),
    memberLimit: integer('member_limit').notNull(),
    createdBy: text('created_by').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [uniqueIndex('clubs_invite_code_idx').on(table.inviteCode)],
);

/** Who is in which club, with their role (spec 3, "Membership"). */
export const clubMembersTable = sqliteTable(
  'club_members',
  {
    clubId: text('club_id')
      .notNull()
      .references(() => clubsTable.id),
    userId: text('user_id').notNull(),
    role: text('role', { enum: CLUB_ROLES }).notNull(),
    joinedAt: integer('joined_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.clubId, table.userId] }),
    index('club_members_user_idx').on(table.userId),
  ],
);

/**
 * The decks a club shares (ADR 0010). `deck_id` names a deck of the decks
 * module and carries no foreign key (rule 25-data: no cross-module keys); a
 * deleted deck simply stops being listed.
 */
export const clubDecksTable = sqliteTable(
  'club_decks',
  {
    clubId: text('club_id')
      .notNull()
      .references(() => clubsTable.id),
    deckId: text('deck_id').notNull(),
    sharedBy: text('shared_by').notNull(),
    sharedAt: integer('shared_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.clubId, table.deckId] })],
);
