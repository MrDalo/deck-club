import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { DATABASE, type Database } from '../../../../infra/database/database.js';
import type { CardRepository } from '../../application/ports/card-repository.js';
import type { Card } from '../../domain/card.js';
import { cardsTable } from './decks.schema.js';

type CardRow = typeof cardsTable.$inferSelect;
type CardInsert = typeof cardsTable.$inferInsert;

const toCard = ({ source, clientName, ...row }: CardRow): Card => ({
  ...row,
  provenance: { source, clientName },
});

const toRow = ({ provenance, ...card }: Card): CardInsert => ({
  ...card,
  source: provenance.source,
  clientName: provenance.clientName,
});

/** Production adapter for {@link CardRepository} on SQLite. */
@Injectable()
export class DrizzleCardRepository implements CardRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async listByDeck(deckId: string): Promise<Card[]> {
    const rows = await this.database
      .select()
      .from(cardsTable)
      .where(and(eq(cardsTable.deckId, deckId), isNull(cardsTable.deletedAt)))
      .orderBy(asc(cardsTable.createdAt), asc(cardsTable.id));
    return rows.map(toCard);
  }

  async findById(deckId: string, cardId: string): Promise<Card | null> {
    const [row] = await this.database
      .select()
      .from(cardsTable)
      .where(
        and(eq(cardsTable.id, cardId), eq(cardsTable.deckId, deckId), isNull(cardsTable.deletedAt)),
      );
    return row === undefined ? null : toCard(row);
  }

  async insertMany(cards: readonly Card[]): Promise<void> {
    if (cards.length === 0) return;
    // One statement: SQLite inserts every row or none.
    await this.database.insert(cardsTable).values(cards.map(toRow));
  }

  async update(card: Card): Promise<void> {
    const { id, ...fields } = toRow(card);
    await this.database.update(cardsTable).set(fields).where(eq(cardsTable.id, id));
  }
}
