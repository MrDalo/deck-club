import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, inArray, isNull } from 'drizzle-orm';
import { DATABASE, type Database } from '../../../../infra/database/database.js';
import type { DeckRepository, DeckWithCardCount } from '../../application/ports/deck-repository.js';
import type { Deck } from '../../domain/deck.js';
import { cardsTable, decksTable } from './decks.schema.js';

type DeckRow = typeof decksTable.$inferSelect;

const toDeck = (row: DeckRow): Deck => ({ ...row });

/** Production adapter for {@link DeckRepository} on SQLite. */
@Injectable()
export class DrizzleDeckRepository implements DeckRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async listByOwner(ownerId: string): Promise<DeckWithCardCount[]> {
    const rows = await this.selectWithCount()
      .where(and(eq(decksTable.ownerId, ownerId), isNull(decksTable.deletedAt)))
      .groupBy(decksTable.id)
      .orderBy(desc(decksTable.updatedAt));
    return rows.map((row) => ({ deck: toDeck(row.deck), cardCount: row.cardCount }));
  }

  async findById(deckId: string): Promise<DeckWithCardCount | null> {
    const [row] = await this.selectWithCount()
      .where(and(eq(decksTable.id, deckId), isNull(decksTable.deletedAt)))
      .groupBy(decksTable.id);
    return row === undefined ? null : { deck: toDeck(row.deck), cardCount: row.cardCount };
  }

  async listByIds(deckIds: readonly string[]): Promise<DeckWithCardCount[]> {
    if (deckIds.length === 0) return [];
    const rows = await this.selectWithCount()
      .where(and(inArray(decksTable.id, [...deckIds]), isNull(decksTable.deletedAt)))
      .groupBy(decksTable.id);
    return rows.map((row) => ({ deck: toDeck(row.deck), cardCount: row.cardCount }));
  }

  async insert(deck: Deck): Promise<void> {
    await this.database.insert(decksTable).values(deck);
  }

  async update(deck: Deck): Promise<void> {
    const { id, ...fields } = deck;
    await this.database.update(decksTable).set(fields).where(eq(decksTable.id, id));
  }

  private selectWithCount() {
    return this.database
      .select({ deck: decksTable, cardCount: count(cardsTable.id) })
      .from(decksTable)
      .leftJoin(cardsTable, and(eq(cardsTable.deckId, decksTable.id), isNull(cardsTable.deletedAt)))
      .$dynamic();
  }
}
