import type { Card } from '../../domain/card.js';

/** Port: card persistence. Reads never return soft-deleted cards. */
export type CardRepository = {
  /** Live cards of a deck, oldest first (the order new cards are studied in). */
  listByDeck(deckId: string): Promise<Card[]>;
  findById(deckId: string, cardId: string): Promise<Card | null>;
  /** Inserts all cards or none. */
  insertMany(cards: readonly Card[]): Promise<void>;
  /** Saves every field of an existing card, including `deletedAt`. */
  update(card: Card): Promise<void>;
};

/** Nest injection token for {@link CardRepository}. */
export const CARD_REPOSITORY = Symbol('CARD_REPOSITORY');
