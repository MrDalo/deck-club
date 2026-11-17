import type { Card } from '../../domain/card.js';
import type { Deck } from '../../domain/deck.js';
import type { CardRepository } from '../../application/ports/card-repository.js';
import type { DeckRepository, DeckWithCardCount } from '../../application/ports/deck-repository.js';

/**
 * Test adapters for both ports, sharing one store so card counts are real.
 * Use-case tests use these; never mock a port ad hoc (rule 40-tests).
 */
export class InMemoryDeckStore {
  readonly decks = new Map<string, Deck>();
  readonly cards = new Map<string, Card>();

  readonly deckRepository: DeckRepository = {
    listByOwner: (ownerId) =>
      Promise.resolve(
        [...this.decks.values()]
          .filter((deck) => deck.ownerId === ownerId && deck.deletedAt === null)
          .sort((first, second) => second.updatedAt.getTime() - first.updatedAt.getTime())
          .map((deck) => this.withCount(deck)),
      ),
    findById: (deckId) => {
      const deck = this.decks.get(deckId);
      if (deck?.deletedAt !== null) return Promise.resolve(null);
      return Promise.resolve(this.withCount(deck));
    },
    insert: (deck) => {
      this.decks.set(deck.id, deck);
      return Promise.resolve();
    },
    update: (deck) => {
      this.decks.set(deck.id, deck);
      return Promise.resolve();
    },
  };

  readonly cardRepository: CardRepository = {
    listByDeck: (deckId) => Promise.resolve(this.liveCards(deckId)),
    findById: (deckId, cardId) => {
      const card = this.cards.get(cardId);
      return Promise.resolve(card?.deckId === deckId && card.deletedAt === null ? card : null);
    },
    insertMany: (cards) => {
      for (const card of cards) this.cards.set(card.id, card);
      return Promise.resolve();
    },
    update: (card) => {
      this.cards.set(card.id, card);
      return Promise.resolve();
    },
  };

  private liveCards(deckId: string): Card[] {
    return [...this.cards.values()]
      .filter((card) => card.deckId === deckId && card.deletedAt === null)
      .sort((first, second) => first.createdAt.getTime() - second.createdAt.getTime());
  }

  private withCount(deck: Deck): DeckWithCardCount {
    return { deck, cardCount: this.liveCards(deck.id).length };
  }
}
