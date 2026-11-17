import type { Card, CreateCardInput, CreateDeckInput, Deck, ErrorCode } from '@deck-club/contracts';

/** Who is calling: the user's access token and the AI client acting for them. */
export type ApiCaller = {
  accessToken: string;
  clientName: string;
};

/** A deck with its cards, as `get_deck` returns it. */
export type DeckWithCards = {
  deck: Deck;
  cards: Card[];
};

/**
 * Port: the core API. The MCP server holds no business rules and no data;
 * every tool is a call through this port (product spec 5: one shared core).
 */
export type DeckClubApi = {
  listDecks(caller: ApiCaller): Promise<Deck[]>;
  getDeck(caller: ApiCaller, deckId: string): Promise<DeckWithCards>;
  createDeck(caller: ApiCaller, input: CreateDeckInput): Promise<Deck>;
  addCards(caller: ApiCaller, deckId: string, cards: CreateCardInput[]): Promise<Card[]>;
};

/** Nest injection token for {@link DeckClubApi}. */
export const DECK_CLUB_API = Symbol('DECK_CLUB_API');

/** The API refused or could not answer. `detail` is safe to show the user. */
export class ApiRequestError extends Error {
  /**
   * @param code - the contracts error code
   * @param detail - one human-readable sentence from the API
   */
  constructor(
    readonly code: ErrorCode,
    readonly detail: string,
  ) {
    super(`${code}: ${detail}`);
    this.name = 'ApiRequestError';
  }
}
