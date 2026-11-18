import type {
  AddCardsInput,
  Card,
  CardSearchCommand,
  CardSearchResult,
  CreateDeckInput,
  Deck,
  UpdateCardInput,
} from '@deck-club/contracts';
import { DeckClubError } from '../../../common/errors/deck-club-error.js';
import type { McpCaller } from '../../../common/mcp/mcp-caller.js';
import type { DecksApi, WriteOptions, WriteResult } from '../application/ports/decks-api.js';

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
  /** Every card `deleteCard` was asked to delete, refused or not. */
  readonly deletions: { deckId: string; cardId: string }[] = [];
  private deleteFailure: { after: number; error: DeckClubError } | null = null;
  /** Every change `updateCard` was asked to make, refused or not. */
  readonly updates: { deckId: string; cardId: string; patch: UpdateCardInput }[] = [];
  /** Every batch `addCards` was asked to write, refused or not. */
  readonly batches: { deckId: string; input: AddCardsInput }[] = [];
  private readonly cards = new Map<string, Card[]>();
  private searchResult: CardSearchResult = { hits: [], totalMatches: 0 };
  private failure: DeckClubError | null = null;
  private writeFailure: DeckClubError | null = null;
  private listFailure: DeckClubError | null = null;
  private addedCardCount = 0;
  /** The idempotency key of every write, `undefined` when the AI sent none. */
  readonly idempotencyKeys: (string | undefined)[] = [];
  private readonly answered = new Map<string, { request: string; answer: unknown }>();

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

  /** Makes `addCards` and `updateCard` refuse, after the deck was found, as the API would. */
  failWritesWith(error: DeckClubError): this {
    this.writeFailure = error;
    return this;
  }

  /**
   * Lets `deleteCard` delete `after` cards, then refuse every later one, e.g.
   * the API going away half-way through a batch.
   */
  failDeletesAfter(after: number, error: DeckClubError): this {
    this.deleteFailure = { after, error };
    return this;
  }

  /** Makes `listCards` refuse, e.g. the API going away just after a write. */
  failListingCardsWith(error: DeckClubError): this {
    this.listFailure = error;
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
    if (this.listFailure !== null) throw this.listFailure;
    return this.cards.get(deckId) ?? [];
  }

  async addCards(
    caller: McpCaller,
    deckId: string,
    input: AddCardsInput,
    options: WriteOptions = {},
  ): Promise<WriteResult<Card[]>> {
    this.callers.push(caller);
    this.batches.push({ deckId, input });
    this.idempotencyKeys.push(options.idempotencyKey);
    await this.owned(caller, deckId);
    if (this.writeFailure !== null) throw this.writeFailure;
    return this.once(caller, options, ['batch', deckId, input], () =>
      this.insertCards(caller, deckId, input),
    );
  }

  async updateCard(
    caller: McpCaller,
    card: { deckId: string; cardId: string },
    patch: UpdateCardInput,
  ): Promise<Card> {
    this.callers.push(caller);
    this.updates.push({ ...card, patch });
    await this.owned(caller, card.deckId);
    if (this.writeFailure !== null) throw this.writeFailure;
    const cards = this.cards.get(card.deckId) ?? [];
    const current = cards.find((each) => each.id === card.cardId);
    if (current === undefined)
      throw new DeckClubError('CARD_NOT_FOUND', 'No card with that id exists in this deck.');
    // The API's rule (applyCardPatch): given fields replace, the rest is kept.
    const updated: Card = {
      ...current,
      front: patch.front ?? current.front,
      back: patch.back ?? current.back,
      extra: patch.extra ?? current.extra,
      tags: patch.tags ?? current.tags,
      updatedAt: '2026-11-18T10:00:00.000Z',
    };
    this.cards.set(
      card.deckId,
      cards.map((each) => (each.id === card.cardId ? updated : each)),
    );
    return updated;
  }

  async deleteCard(caller: McpCaller, card: { deckId: string; cardId: string }): Promise<void> {
    this.callers.push(caller);
    this.deletions.push(card);
    await this.owned(caller, card.deckId);
    if (this.writeFailure !== null) throw this.writeFailure;
    if (this.deleteFailure !== null && this.deletions.length > this.deleteFailure.after)
      throw this.deleteFailure.error;
    const cards = this.cards.get(card.deckId) ?? [];
    if (!cards.some((each) => each.id === card.cardId))
      throw new DeckClubError('CARD_NOT_FOUND', 'No card with that id exists in this deck.');
    this.cards.set(
      card.deckId,
      cards.filter((each) => each.id !== card.cardId),
    );
  }

  /**
   * Runs a write at most once per caller and key, like the API (ADR 0009):
   * the same request again is answered with the first result, replayed; a
   * different request with the key is refused.
   */
  private once<Value>(
    caller: McpCaller,
    options: WriteOptions,
    request: unknown,
    write: () => Value,
  ): Promise<WriteResult<Value>> {
    if (options.idempotencyKey === undefined)
      return Promise.resolve({ value: write(), replayed: false });
    const slot = `${caller.accessToken} ${options.idempotencyKey}`;
    const fingerprint = JSON.stringify(request);
    const earlier = this.answered.get(slot);
    if (earlier === undefined) {
      const value = write();
      this.answered.set(slot, { request: fingerprint, answer: value });
      return Promise.resolve({ value, replayed: false });
    }
    if (earlier.request !== fingerprint)
      return Promise.reject(
        new DeckClubError(
          'IDEMPOTENCY_KEY_REUSED',
          'This Idempotency-Key was already used for a different request. Use a new key for a new request.',
        ),
      );
    return Promise.resolve({ value: earlier.answer as Value, replayed: true });
  }

  private insertCards(caller: McpCaller, deckId: string, input: AddCardsInput): Card[] {
    const added = input.cards.map((card) => {
      this.addedCardCount += 1;
      return testCard({
        id: `00000000-0000-4000-8000-${String(700 + this.addedCardCount).padStart(12, '0')}`,
        deckId,
        type: card.type ?? 'basic',
        front: card.front,
        back: card.back,
        extra: card.extra ?? '',
        tags: card.tags ?? [],
        provenance: { source: 'mcp', clientName: caller.clientName },
      });
    });
    this.cards.set(deckId, [...(this.cards.get(deckId) ?? []), ...added]);
    return added;
  }

  async searchCards(caller: McpCaller, command: CardSearchCommand): Promise<CardSearchResult> {
    this.callers.push(caller);
    this.searches.push(command);
    if (command.deckId !== undefined) await this.owned(caller, command.deckId);
    else if (this.failure !== null) throw this.failure;
    return this.searchResult;
  }

  createDeck(
    caller: McpCaller,
    input: CreateDeckInput,
    options: WriteOptions = {},
  ): Promise<WriteResult<Deck>> {
    this.callers.push(caller);
    this.created.push(input);
    this.idempotencyKeys.push(options.idempotencyKey);
    if (this.failure !== null) return Promise.reject(this.failure);
    return this.once(caller, options, ['create', input], () => {
      const library = this.libraries.get(caller.accessToken) ?? [];
      const deck = testDeck({
        id: `00000000-0000-4000-8000-${String(900 + this.created.length).padStart(12, '0')}`,
        title: input.title,
        description: input.description ?? '',
        language: input.language ?? 'en',
        tags: input.tags ?? [],
      });
      this.libraries.set(caller.accessToken, [...library, deck]);
      return deck;
    });
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
