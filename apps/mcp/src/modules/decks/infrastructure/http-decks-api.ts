import {
  type Card,
  CardListSchema,
  type CardSearchCommand,
  type CardSearchResult,
  CardSearchResultSchema,
  type CreateDeckInput,
  type Deck,
  DeckListSchema,
  DeckSchema,
} from '@deck-club/contracts';
import type { McpCaller } from '../../../common/mcp/mcp-caller.js';
import type {
  ApiCredentials,
  DeckClubApiClient,
} from '../../../infra/deck-club-api/deck-club-api-client.js';
import type { DecksApi } from '../application/ports/decks-api.js';

const credentialsOf = (caller: McpCaller): ApiCredentials => ({
  accessToken: caller.accessToken,
  clientName: caller.clientName,
});

const deckPath = (deckId: string): string => `/decks/${encodeURIComponent(deckId)}`;

/**
 * Adapter: the core API's `/decks` endpoints over the private network. It
 * forwards the caller's access token (the API verifies it again and checks
 * the deck is theirs) and names the AI client, so writes record provenance
 * such as "Added by Claude".
 */
export class HttpDecksApi implements DecksApi {
  /** @param api - the shared API client */
  constructor(private readonly api: DeckClubApiClient) {}

  async listDecks(caller: McpCaller): Promise<Deck[]> {
    const list = await this.api.send({
      method: 'GET',
      path: '/decks',
      schema: DeckListSchema,
      credentials: credentialsOf(caller),
    });
    return list.decks;
  }

  getDeck(caller: McpCaller, deckId: string): Promise<Deck> {
    return this.api.send({
      method: 'GET',
      path: deckPath(deckId),
      schema: DeckSchema,
      credentials: credentialsOf(caller),
    });
  }

  createDeck(caller: McpCaller, input: CreateDeckInput): Promise<Deck> {
    return this.api.send({
      method: 'POST',
      path: '/decks',
      body: input,
      schema: DeckSchema,
      credentials: credentialsOf(caller),
    });
  }

  searchCards(caller: McpCaller, command: CardSearchCommand): Promise<CardSearchResult> {
    return this.api.send({
      method: 'GET',
      path: '/cards/search',
      query: { q: command.q, deckId: command.deckId, limit: command.limit },
      schema: CardSearchResultSchema,
      credentials: credentialsOf(caller),
    });
  }

  async listCards(caller: McpCaller, deckId: string): Promise<Card[]> {
    const list = await this.api.send({
      method: 'GET',
      path: `${deckPath(deckId)}/cards`,
      schema: CardListSchema,
      credentials: credentialsOf(caller),
    });
    return list.cards;
  }
}
