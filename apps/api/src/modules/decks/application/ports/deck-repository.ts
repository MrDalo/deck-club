import type { Deck } from '../../domain/deck.js';

/** A deck with the number of its live (not soft-deleted) cards. */
export type DeckWithCardCount = {
  deck: Deck;
  cardCount: number;
};

/** Port: deck persistence. Reads never return soft-deleted decks. */
export type DeckRepository = {
  listByOwner(ownerId: string): Promise<DeckWithCardCount[]>;
  findById(deckId: string): Promise<DeckWithCardCount | null>;
  /** The live decks among these ids, whoever owns them; missing and deleted ones are left out. */
  listByIds(deckIds: readonly string[]): Promise<DeckWithCardCount[]>;
  insert(deck: Deck): Promise<void>;
  /** Saves every field of an existing deck, including `deletedAt`. */
  update(deck: Deck): Promise<void>;
};

/** Nest injection token for {@link DeckRepository}. */
export const DECK_REPOSITORY = Symbol('DECK_REPOSITORY');
