import type {
  Card,
  CardSearchCommand,
  CardSearchResult,
  CreateDeckInput,
  Deck,
} from '@deck-club/contracts';
import { DeckClubError } from '../../../common/errors/deck-club-error.js';
import type { McpCaller } from '../../../common/mcp/mcp-caller.js';
import type { DecksApi } from '../application/ports/decks-api.js';

const TIMESTAMP = '2026-11-17T10:00:00.000Z';

/**
 * A deck as the API returns it, with everything but the given fields filled in.
 * @param deck - the fields that matter to the test
 * @returns the deck
 */
export function testDeck(deck: Partial<Deck> & Pick<Deck, 'id' | 'title'>): Deck {
  return {
    description: '',
    language: 'en',
    tags: [],
    visibility: 'private',
    cardCount: 0,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...deck,
  };
}

/**
 * A card as the API returns it, with everything but the given fields filled in.
 * @param card - the fields that matter to the test
 * @returns the card
 */
export function testCard(card: Partial<Card> & Pick<Card, 'id' | 'deckId'>): Card {
  return {
    type: 'basic',
    front: 'front',
    back: 'back',
    extra: '',
    tags: [],
    provenance: { source: 'app', clientName: null },
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...card,
  };
}

/** In-memory {@link DecksApi}: one library per access token, refusing other people's decks like the API. */
export class FakeDecksApi implements DecksApi {
  readonly callers: McpCaller[] = [];
  private readonly libraries = new Map<string, Deck[]>();
  readonly searches: CardSearchCommand[] = [];
  readonly created: CreateDeckInput[] = [];
  private readonly cards = new Map<string, Card[]>();
  private searchResult: CardSearchResult = { hits: [], totalMatches: 0 };
  private failure: DeckClubError | null = null;

  /** Gives the owner of `accessToken` these decks. */
  withDecks(accessToken: string, decks: Deck[]): this {
    this.libraries.set(accessToken, decks);
    return this;
  }

  /** Puts these cards in a deck. */
  withCards(deckId: string, cards: Card[]): this {
    this.cards.set(deckId, cards);
    return this;
  }

  /**
   * What every search answers. The fake does not match text itself: the
   * matching rule is the API's, tested there.
   */
  withSearchResult(result: CardSearchResult): this {
    this.searchResult = result;
    return this;
  }

  /** Makes every call refuse, as the API would. */
  failWith(error: DeckClubError): this {
    this.failure = error;
    return this;
  }

  listDecks(caller: McpCaller): Promise<Deck[]> {
    this.callers.push(caller);
    if (this.failure !== null) return Promise.reject(this.failure);
    return Promise.resolve(this.libraries.get(caller.accessToken) ?? []);
  }

  getDeck(caller: McpCaller, deckId: string): Promise<Deck> {
    this.callers.push(caller);
    return this.owned(caller, deckId);
  }

  async listCards(caller: McpCaller, deckId: string): Promise<Card[]> {
    this.callers.push(caller);
    await this.owned(caller, deckId);
    return this.cards.get(deckId) ?? [];
  }

  async searchCards(caller: McpCaller, command: CardSearchCommand): Promise<CardSearchResult> {
    this.callers.push(caller);
    this.searches.push(command);
    if (command.deckId !== undefined) await this.owned(caller, command.deckId);
    else if (this.failure !== null) throw this.failure;
    return this.searchResult;
  }

  createDeck(caller: McpCaller, input: CreateDeckInput): Promise<Deck> {
    this.callers.push(caller);
    this.created.push(input);
    if (this.failure !== null) return Promise.reject(this.failure);
    const library = this.libraries.get(caller.accessToken) ?? [];
    const deck = testDeck({
      id: `00000000-0000-4000-8000-${String(900 + this.created.length).padStart(12, '0')}`,
      title: input.title,
      description: input.description ?? '',
      language: input.language ?? 'en',
      tags: input.tags ?? [],
    });
    this.libraries.set(caller.accessToken, [...library, deck]);
    return Promise.resolve(deck);
  }

  private owned(caller: McpCaller, deckId: string): Promise<Deck> {
    if (this.failure !== null) return Promise.reject(this.failure);
    const deck = (this.libraries.get(caller.accessToken) ?? []).find((each) => each.id === deckId);
    if (deck === undefined)
      return Promise.reject(
        new DeckClubError('DECK_NOT_FOUND', 'No deck with that id exists in your library.'),
      );
    return Promise.resolve(deck);
  }
}
