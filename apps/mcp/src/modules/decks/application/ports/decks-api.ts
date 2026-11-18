import type {
  Card,
  CardSearchCommand,
  CardSearchResult,
  CreateDeckInput,
  Deck,
} from '@deck-club/contracts';
import type { McpCaller } from '../../../../common/mcp/mcp-caller.js';

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
   * from the token, never from the request).
   * @throws DeckClubError VALIDATION_FAILED with field problems when the API refuses the input
   */
  createDeck(caller: McpCaller, input: CreateDeckInput): Promise<Deck>;
};

/** Nest injection token for {@link DecksApi}. */
export const DECKS_API = Symbol('DECKS_API');
