import {
  type AddCardsInput,
  type Card,
  CardListSchema,
  type CardSearchCommand,
  type CardSearchResult,
  CardSearchResultSchema,
  type CreateDeckInput,
  CardSchema,
  type Deck,
  DeckListSchema,
  DeckSchema,
  NoContentSchema,
  type UpdateCardInput,
} from '@deck-club/contracts';
import type { McpCaller } from '../../../common/mcp/mcp-caller.js';
import type {
  ApiCredentials,
  DeckClubApiClient,
} from '../../../infra/deck-club-api/deck-club-api-client.js';
import type { DecksApi, WriteOptions, WriteResult } from '../application/ports/decks-api.js';

const credentialsOf = (caller: McpCaller): ApiCredentials => ({
  accessToken: caller.accessToken,
  clientName: caller.clientName,
});

const deckPath = (deckId: string): string => `/decks/${encodeURIComponent(deckId)}`;

const cardPath = (card: { deckId: string; cardId: string }): string =>
  `${deckPath(card.deckId)}/cards/${encodeURIComponent(card.cardId)}`;

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

  async createDeck(
    caller: McpCaller,
    input: CreateDeckInput,
    options: WriteOptions = {},
  ): Promise<WriteResult<Deck>> {
    const answer = await this.api.sendIdempotent({
      method: 'POST',
      path: '/decks',
      body: input,
      schema: DeckSchema,
      credentials: credentialsOf(caller),
      idempotencyKey: options.idempotencyKey,
    });
    return { value: answer.body, replayed: answer.replayed };
  }

  async addCards(
    caller: McpCaller,
    deckId: string,
    input: AddCardsInput,
    options: WriteOptions = {},
  ): Promise<WriteResult<Card[]>> {
    const answer = await this.api.sendIdempotent({
      method: 'POST',
      path: `${deckPath(deckId)}/cards/batch`,
      body: input,
      schema: CardListSchema,
      credentials: credentialsOf(caller),
      idempotencyKey: options.idempotencyKey,
    });
    return { value: answer.body.cards, replayed: answer.replayed };
  }

  updateCard(
    caller: McpCaller,
    card: { deckId: string; cardId: string },
    patch: UpdateCardInput,
  ): Promise<Card> {
    return this.api.send({
      method: 'PATCH',
      path: cardPath(card),
      body: patch,
      schema: CardSchema,
      credentials: credentialsOf(caller),
    });
  }

  async deleteCard(caller: McpCaller, card: { deckId: string; cardId: string }): Promise<void> {
    await this.api.send({
      method: 'DELETE',
      path: cardPath(card),
      schema: NoContentSchema,
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
