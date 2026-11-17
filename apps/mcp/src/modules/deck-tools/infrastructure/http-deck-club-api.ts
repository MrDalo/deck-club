import {
  CardListSchema,
  CLIENT_NAME_HEADER,
  type CreateCardInput,
  type CreateDeckInput,
  type Deck,
  DeckListSchema,
  DeckSchema,
  ProblemDetailsSchema,
  type Card,
} from '@deck-club/contracts';
import type { ZodType } from 'zod';
import {
  type ApiCaller,
  ApiRequestError,
  type DeckClubApi,
  type DeckWithCards,
} from '../application/ports/deck-club-api.js';

/** Outbound timeout to the core API (rule 20-backend: no infinite waits). */
const API_TIMEOUT_MS = 10_000;

type RequestPlan<Output> = {
  method: 'GET' | 'POST';
  path: string;
  schema: ZodType<Output>;
  body?: unknown;
};

/** Production adapter: calls the core API over the private network with the user's own token. */
export class HttpDeckClubApi implements DeckClubApi {
  /** @param baseUrl - API_INTERNAL_URL, e.g. http://api:4000 */
  constructor(private readonly baseUrl: string) {}

  async listDecks(caller: ApiCaller): Promise<Deck[]> {
    const list = await this.request(caller, {
      method: 'GET',
      path: '/decks',
      schema: DeckListSchema,
    });
    return list.decks;
  }

  async getDeck(caller: ApiCaller, deckId: string): Promise<DeckWithCards> {
    const path = `/decks/${encodeURIComponent(deckId)}`;
    const [deck, list] = await Promise.all([
      this.request(caller, { method: 'GET', path, schema: DeckSchema }),
      this.request(caller, { method: 'GET', path: `${path}/cards`, schema: CardListSchema }),
    ]);
    return { deck, cards: list.cards };
  }

  async createDeck(caller: ApiCaller, input: CreateDeckInput): Promise<Deck> {
    return this.request(caller, {
      method: 'POST',
      path: '/decks',
      schema: DeckSchema,
      body: input,
    });
  }

  async addCards(caller: ApiCaller, deckId: string, cards: CreateCardInput[]): Promise<Card[]> {
    const path = `/decks/${encodeURIComponent(deckId)}/cards/batch`;
    const list = await this.request(caller, {
      method: 'POST',
      path,
      schema: CardListSchema,
      body: { cards },
    });
    return list.cards;
  }

  private async request<Output>(caller: ApiCaller, plan: RequestPlan<Output>): Promise<Output> {
    const response = await this.send(caller, plan);
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) throw toApiError(payload);
    const parsed = plan.schema.safeParse(payload);
    if (!parsed.success)
      throw new ApiRequestError('INTERNAL', 'Deck Club returned an unexpected response.');
    return parsed.data;
  }

  private async send(caller: ApiCaller, plan: RequestPlan<unknown>): Promise<Response> {
    try {
      return await fetch(new URL(plan.path, this.baseUrl), {
        method: plan.method,
        headers: {
          authorization: `Bearer ${caller.accessToken}`,
          [CLIENT_NAME_HEADER]: caller.clientName,
          ...(plan.body !== undefined && { 'content-type': 'application/json' }),
        },
        ...(plan.body !== undefined && { body: JSON.stringify(plan.body) }),
        signal: AbortSignal.timeout(API_TIMEOUT_MS),
      });
    } catch {
      throw new ApiRequestError(
        'UPSTREAM_UNAVAILABLE',
        'Deck Club is not reachable right now. Try again in a minute.',
      );
    }
  }
}

/**
 * Turns an API error body into an {@link ApiRequestError}.
 * @param payload - the parsed response body, possibly not problem details
 * @returns the error to throw
 */
export function toApiError(payload: unknown): ApiRequestError {
  const problem = ProblemDetailsSchema.safeParse(payload);
  if (!problem.success)
    return new ApiRequestError('INTERNAL', 'Deck Club returned an unexpected error.');
  return new ApiRequestError(problem.data.code, problem.data.detail);
}
