import type { Card, CreateCardInput, CreateDeckInput, Deck } from '@deck-club/contracts';
import {
  type ApiCaller,
  ApiRequestError,
  type DeckClubApi,
  type DeckWithCards,
} from '../application/ports/deck-club-api.js';

const TIMESTAMP = '2026-11-17T10:00:00.000Z';

/** In-memory {@link DeckClubApi}: one library per access token, ids are sequential UUIDs. */
export class FakeDeckClubApi implements DeckClubApi {
  readonly calls: { method: string; caller: ApiCaller }[] = [];
  private readonly decks = new Map<string, { owner: string; deck: Deck; cards: Card[] }>();
  private counter = 0;

  listDecks(caller: ApiCaller): Promise<Deck[]> {
    this.calls.push({ method: 'listDecks', caller });
    const owned = [...this.decks.values()].filter((entry) => entry.owner === caller.accessToken);
    return Promise.resolve(owned.map((entry) => entry.deck));
  }

  getDeck(caller: ApiCaller, deckId: string): Promise<DeckWithCards> {
    this.calls.push({ method: 'getDeck', caller });
    const entry = this.owned(caller, deckId);
    return Promise.resolve({ deck: entry.deck, cards: entry.cards });
  }

  createDeck(caller: ApiCaller, input: CreateDeckInput): Promise<Deck> {
    this.calls.push({ method: 'createDeck', caller });
    const deck: Deck = {
      id: this.nextId(),
      title: input.title,
      description: input.description ?? '',
      language: input.language ?? 'en',
      tags: input.tags ?? [],
      visibility: 'private',
      cardCount: 0,
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    };
    this.decks.set(deck.id, { owner: caller.accessToken, deck, cards: [] });
    return Promise.resolve(deck);
  }

  addCards(caller: ApiCaller, deckId: string, cards: CreateCardInput[]): Promise<Card[]> {
    this.calls.push({ method: 'addCards', caller });
    const entry = this.owned(caller, deckId);
    const created = cards.map((input): Card => ({
      id: this.nextId(),
      deckId,
      type: input.type ?? 'basic',
      front: input.front,
      back: input.back,
      extra: input.extra ?? '',
      tags: input.tags ?? [],
      provenance: { source: 'mcp', clientName: caller.clientName },
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    }));
    entry.cards.push(...created);
    entry.deck = { ...entry.deck, cardCount: entry.cards.length };
    return Promise.resolve(created);
  }

  private owned(caller: ApiCaller, deckId: string): { owner: string; deck: Deck; cards: Card[] } {
    const entry = this.decks.get(deckId);
    if (entry?.owner !== caller.accessToken)
      throw new ApiRequestError('DECK_NOT_FOUND', 'No deck with that id exists in your library.');
    return entry;
  }

  private nextId(): string {
    this.counter += 1;
    return `00000000-0000-4000-8000-${this.counter.toString().padStart(12, '0')}`;
  }
}
