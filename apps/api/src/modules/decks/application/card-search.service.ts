import { Inject, Injectable } from '@nestjs/common';
import type { CardSearchCommand, CardSearchResult } from '@deck-club/contracts';
import {
  compareMatches,
  type CardMatch,
  matchCard,
  parseSearchQuery,
} from '../domain/card-search.js';
import { loadManagedDeck } from './deck-access.js';
import { CARD_REPOSITORY, type CardRepository } from './ports/card-repository.js';
import {
  DECK_REPOSITORY,
  type DeckRepository,
  type DeckWithCardCount,
} from './ports/deck-repository.js';
import { toCardDto } from './views.js';

type DeckMatch = { match: CardMatch; deckTitle: string };

/**
 * Searching a user's cards (spec 9, `search_cards`). Reads only decks the
 * user may manage, so another user's cards can never match; the matching
 * rule itself is the domain's.
 */
@Injectable()
export class CardSearchService {
  constructor(
    @Inject(DECK_REPOSITORY) private readonly decks: DeckRepository,
    @Inject(CARD_REPOSITORY) private readonly cards: CardRepository,
  ) {}

  /**
   * @param userId - the signed-in user
   * @param command - the words, an optional deck and the most results to return
   * @returns the best matches first, and how many matched in total
   * @throws AppError DECK_NOT_FOUND when the deck filter names a deck that is not theirs
   */
  async search(userId: string, command: CardSearchCommand): Promise<CardSearchResult> {
    const decks =
      command.deckId === undefined
        ? await this.decks.listByOwner(userId)
        : [await loadManagedDeck(this.decks, userId, command.deckId)];
    const query = parseSearchQuery(command.q);
    const found = await Promise.all(decks.map((entry) => this.matchesIn(entry, query)));
    const ranked = found.flat().sort((left, right) => compareMatches(left.match, right.match));
    return {
      hits: ranked.slice(0, command.limit).map(({ match, deckTitle }) => ({
        card: toCardDto(match.card),
        deckTitle,
        matchedIn: match.matchedIn,
      })),
      totalMatches: ranked.length,
    };
  }

  private async matchesIn(
    entry: DeckWithCardCount,
    query: ReturnType<typeof parseSearchQuery>,
  ): Promise<DeckMatch[]> {
    const cards = await this.cards.listByDeck(entry.deck.id);
    return cards.flatMap((card) => {
      const match = matchCard(card, query);
      return match === null ? [] : [{ match, deckTitle: entry.deck.title }];
    });
  }
}
