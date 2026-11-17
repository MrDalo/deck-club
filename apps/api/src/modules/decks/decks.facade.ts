import { Injectable } from '@nestjs/common';
import type { Card, Deck } from '@deck-club/contracts';
import { CardService } from './application/card.service.js';
import { DeckService } from './application/deck.service.js';

/** A deck with its live cards, oldest first. */
export type DeckWithCards = {
  deck: Deck;
  cards: Card[];
};

/**
 * The decks module's only public surface for other modules (rule 20-backend).
 * Every method is async and returns contract DTOs, never entities, so the
 * module can be extracted into its own service without touching callers.
 */
@Injectable()
export class DecksFacade {
  constructor(
    private readonly deckService: DeckService,
    private readonly cardService: CardService,
  ) {}

  /** The deck when the user may manage it; throws DECK_NOT_FOUND otherwise. */
  async getManagedDeck(userId: string, deckId: string): Promise<Deck> {
    return this.deckService.get(userId, deckId);
  }

  /**
   * The user's decks with their cards, for building study sessions.
   * @param userId - the signed-in user
   * @param deckId - only this deck (throws DECK_NOT_FOUND if not theirs), or every deck
   * @returns each deck with its live cards
   */
  async listDecksWithCards(userId: string, deckId?: string): Promise<DeckWithCards[]> {
    const decks =
      deckId === undefined
        ? await this.deckService.list(userId)
        : [await this.deckService.get(userId, deckId)];
    return Promise.all(
      decks.map(async (deck) => ({ deck, cards: await this.cardService.list(userId, deck.id) })),
    );
  }

  /** One card of a deck the user may manage; throws DECK_NOT_FOUND or CARD_NOT_FOUND otherwise. */
  async getManagedCard(userId: string, deckId: string, cardId: string): Promise<Card> {
    return this.cardService.get(userId, { deckId, cardId });
  }
}
