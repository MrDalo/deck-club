import type {
  AddCardsInput,
  Card,
  CardSearchCommand,
  CardSearchResult,
  CreateDeckInput,
  Deck,
  UpdateCardInput,
} from '@deck-club/contracts';
import type { McpCaller } from '../../../../common/mcp/mcp-caller.js';

/** How a write is sent: with the AI's idempotency key, when it gave one (ADR 0009). */
export type WriteOptions = {
  idempotencyKey?: string | undefined;
};

/** What a write answers. */
export type WriteResult<Value> = {
  value: Value;
  /**
   * True when the API recognised a retry of an earlier call with the same
   * idempotency key and answered with that call's result, writing nothing.
   */
  replayed: boolean;
};

/**
 * Port: the deck endpoints of the core API. Every call carries the user's
 * own token, so the API applies the same rules and permissions as the web
 * app (spec 5: one shared core, spec 9: the MCP server is a first-class
 * client with no rules of its own). A deck the caller may not see is
 * reported as not found, never as someone else's.
 */
export type DecksApi = {
  /**
   * The decks the caller can study.
   * @throws DeckClubError with the API's code when the API refuses or cannot be reached
   */
  listDecks(caller: McpCaller): Promise<Deck[]>;

  /**
   * One deck of the caller's.
   * @throws DeckClubError DECK_NOT_FOUND when it does not exist or is not theirs
   */
  getDeck(caller: McpCaller, deckId: string): Promise<Deck>;

  /**
   * Every card of one of the caller's decks, in the order they were added.
   * @throws DeckClubError DECK_NOT_FOUND when the deck does not exist or is not theirs
   */
  listCards(caller: McpCaller, deckId: string): Promise<Card[]>;

  /**
   * The caller's cards that match a search, best first. The matching rule
   * is the API's, so the AI, the web app and duplicate detection agree.
   * @throws DeckClubError DECK_NOT_FOUND when the deck filter names a deck that is not theirs
   */
  searchCards(caller: McpCaller, command: CardSearchCommand): Promise<CardSearchResult>;

  /**
   * Creates a private deck owned by the caller (the API takes the owner
   * from the token, never from the request). With an idempotency key, a
   * retry answers with the deck the first call created.
   * @throws DeckClubError VALIDATION_FAILED with field problems when the API refuses the input, IDEMPOTENCY_KEY_REUSED or IDEMPOTENCY_KEY_IN_USE for the key
   */
  createDeck(
    caller: McpCaller,
    input: CreateDeckInput,
    options?: WriteOptions,
  ): Promise<WriteResult<Deck>>;

  /**
   * Adds a batch of cards to one of the caller's decks, all or nothing. The
   * API stamps them with the AI client's name as provenance ("Added by
   * Claude"). With an idempotency key, a retry answers with the cards the
   * first call added and adds none.
   * @returns the new cards, in the order they were sent
   * @throws DeckClubError DECK_NOT_FOUND when the deck is not theirs, VALIDATION_FAILED with field problems when a card is refused (nothing is added), IDEMPOTENCY_KEY_REUSED or IDEMPOTENCY_KEY_IN_USE for the key
   */
  addCards(
    caller: McpCaller,
    deckId: string,
    input: AddCardsInput,
    options?: WriteOptions,
  ): Promise<WriteResult<Card[]>>;

  /**
   * Changes the given fields of one card and keeps the rest, its type, its
   * author and every learner's study state (spec 3). Tags, when given,
   * replace the card's tags. Sending the same change again gives the same
   * card.
   * @returns the card as it is now
   * @throws DeckClubError DECK_NOT_FOUND when the deck is not theirs, CARD_NOT_FOUND when the card is not in it, VALIDATION_FAILED with field problems
   */
  updateCard(
    caller: McpCaller,
    card: { deckId: string; cardId: string },
    patch: UpdateCardInput,
  ): Promise<Card>;

  /**
   * Deletes one card of one of the caller's decks. The API only marks it
   * deleted (spec 3: soft delete); there is no way to restore it yet.
   * @throws DeckClubError DECK_NOT_FOUND when the deck is not theirs, CARD_NOT_FOUND when the card is not in it (or is already deleted)
   */
  deleteCard(caller: McpCaller, card: { deckId: string; cardId: string }): Promise<void>;
};

/** Nest injection token for {@link DecksApi}. */
export const DECKS_API = Symbol('DECKS_API');
