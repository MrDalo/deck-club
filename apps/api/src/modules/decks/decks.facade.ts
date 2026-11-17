import { Injectable } from '@nestjs/common';
import type { Deck } from '@deck-club/contracts';
import { DeckService } from './application/deck.service.js';

/**
 * The decks module's only public surface for other modules (rule 20-backend).
 * Every method is async and returns contract DTOs, never entities, so the
 * module can be extracted into its own service without touching callers.
 * The study and clubs modules (Phase 1–2) will call it to check deck access.
 */
@Injectable()
export class DecksFacade {
  constructor(private readonly deckService: DeckService) {}

  /** The deck when the user may manage it; throws DECK_NOT_FOUND otherwise. */
  async getManagedDeck(userId: string, deckId: string): Promise<Deck> {
    return this.deckService.get(userId, deckId);
  }
}
