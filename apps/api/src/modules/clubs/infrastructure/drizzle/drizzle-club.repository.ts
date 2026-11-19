import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, eq, inArray, sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../../../../infra/database/database.js';
import type { ClubRepository } from '../../application/ports/club-repository.js';
import type { Club, Membership, SharedDeck } from '../../domain/club.js';
import { clubDecksTable, clubMembersTable, clubsTable } from './clubs.schema.js';

/** Production adapter for {@link ClubRepository} on SQLite. */
@Injectable()
export class DrizzleClubRepository implements ClubRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async insert(club: Club, owner: Membership): Promise<void> {
    await this.database.batch([
      this.database.insert(clubsTable).values(club),
      this.database.insert(clubMembersTable).values(owner),
    ]);
  }

  async findByInviteCode(inviteCode: string): Promise<Club | null> {
    const [row] = await this.database
      .select()
      .from(clubsTable)
      .where(eq(clubsTable.inviteCode, inviteCode));
    return row ?? null;
  }

  async listByIds(clubIds: readonly string[]): Promise<Club[]> {
    if (clubIds.length === 0) return [];
    return this.database
      .select()
      .from(clubsTable)
      .where(inArray(clubsTable.id, [...clubIds]));
  }

  async listMemberships(userId: string): Promise<Membership[]> {
    return this.database
      .select()
      .from(clubMembersTable)
      .where(eq(clubMembersTable.userId, userId))
      .orderBy(asc(clubMembersTable.joinedAt), asc(clubMembersTable.clubId));
  }

  async findMembership(clubId: string, userId: string): Promise<Membership | null> {
    const [row] = await this.database
      .select()
      .from(clubMembersTable)
      .where(and(eq(clubMembersTable.clubId, clubId), eq(clubMembersTable.userId, userId)));
    return row ?? null;
  }

  async countMembers(clubIds: readonly string[]): Promise<Map<string, number>> {
    if (clubIds.length === 0) return new Map();
    const rows = await this.database
      .select({ clubId: clubMembersTable.clubId, members: count() })
      .from(clubMembersTable)
      .where(inArray(clubMembersTable.clubId, [...clubIds]))
      .groupBy(clubMembersTable.clubId);
    return new Map(rows.map((row) => [row.clubId, row.members]));
  }

  async addMemberIfRoom(membership: Membership, limit: number): Promise<boolean> {
    // One statement: SQLite counts and inserts atomically, so the last place goes to one person.
    const result = await this.database.run(sql`
      INSERT INTO ${clubMembersTable} (club_id, user_id, role, joined_at)
      SELECT ${membership.clubId}, ${membership.userId}, ${membership.role}, ${membership.joinedAt.getTime()}
      WHERE (SELECT count(*) FROM ${clubMembersTable} WHERE club_id = ${membership.clubId}) < ${limit}
      ON CONFLICT DO NOTHING`);
    return result.rowsAffected === 1;
  }

  async listSharedDecks(clubIds: readonly string[]): Promise<SharedDeck[]> {
    if (clubIds.length === 0) return [];
    return this.database
      .select()
      .from(clubDecksTable)
      .where(inArray(clubDecksTable.clubId, [...clubIds]))
      .orderBy(asc(clubDecksTable.sharedAt), asc(clubDecksTable.deckId));
  }

  async shareDeck(shared: SharedDeck): Promise<void> {
    await this.database.insert(clubDecksTable).values(shared).onConflictDoNothing();
  }
}
