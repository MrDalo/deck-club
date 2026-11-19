import {
  type Deck,
  DeckSchema,
  type DueCards,
  DueCardsSchema,
  ReviewResultSchema,
  type StudyStats,
  StudyStatsSchema,
  type SubmitReviewCommand,
  type Today,
  TodaySchema,
} from '@deck-club/contracts';
import type { McpCaller } from '../../../common/mcp/mcp-caller.js';
import {
  credentialsOf,
  type DeckClubApiClient,
} from '../../../infra/deck-club-api/deck-club-api-client.js';
import type { DueCardsRequest, RecordedReview, StudyApi } from '../application/ports/study-api.js';

/**
 * Adapter: the core API's `/study` endpoints (and `GET /decks/:id`) over the
 * private network. It forwards the caller's access token, which the API
 * verifies again before it reads that user's schedule, and names the AI
 * client, so the API records a review as made through it (source `mcp`).
 */
export class HttpStudyApi implements StudyApi {
  /** @param api - the shared API client */
  constructor(private readonly api: DeckClubApiClient) {}

  getDueCards(caller: McpCaller, request: DueCardsRequest): Promise<DueCards> {
    return this.api.send({
      method: 'GET',
      path: '/study/due',
      query: { deckId: request.deckId, limit: request.limit },
      schema: DueCardsSchema,
      credentials: credentialsOf(caller),
    });
  }

  async submitReview(
    caller: McpCaller,
    command: SubmitReviewCommand,
    options: { idempotencyKey?: string | undefined },
  ): Promise<RecordedReview> {
    const answer = await this.api.sendIdempotent({
      method: 'POST',
      path: '/study/reviews',
      body: command,
      schema: ReviewResultSchema,
      credentials: credentialsOf(caller),
      idempotencyKey: options.idempotencyKey,
    });
    return { review: answer.body, replayed: answer.replayed };
  }

  getStats(caller: McpCaller): Promise<StudyStats> {
    return this.api.send({
      method: 'GET',
      path: '/study/stats',
      schema: StudyStatsSchema,
      credentials: credentialsOf(caller),
    });
  }

  getToday(caller: McpCaller): Promise<Today> {
    return this.api.send({
      method: 'GET',
      path: '/study/today',
      schema: TodaySchema,
      credentials: credentialsOf(caller),
    });
  }

  getDeck(caller: McpCaller, deckId: string): Promise<Deck> {
    return this.api.send({
      method: 'GET',
      path: `/decks/${encodeURIComponent(deckId)}`,
      schema: DeckSchema,
      credentials: credentialsOf(caller),
    });
  }
}
