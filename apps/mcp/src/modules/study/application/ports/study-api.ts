import type {
  Deck,
  DueCards,
  ReviewResult,
  StudyStats,
  SubmitReviewCommand,
  Today,
} from '@deck-club/contracts';
import type { McpCaller } from '../../../../common/mcp/mcp-caller.js';

/** Which due cards to read: one deck or all, and how many at most. */
export type DueCardsRequest = {
  /** Only this deck's cards; every deck when omitted. */
  deckId?: string | undefined;
  limit: number;
};

/** A review the API recorded. */
export type RecordedReview = {
  review: ReviewResult;
  /**
   * True when the API recognised a retry of an earlier call with the same
   * idempotency key and answered with that call's review, recording nothing.
   */
  replayed: boolean;
};

/**
 * Port: the study endpoints of the core API, and the deck read the study
 * tools need to name a deck. Every call carries the user's own token, so a
 * review from the chat goes through the same FSRS engine, daily limits and
 * permissions as one in the app (spec 6: one schedule, spec 9: the MCP
 * server has no rules of its own). A deck the caller may not see is
 * reported as not found, never as someone else's.
 */
export type StudyApi = {
  /**
   * The next cards to study now, in session order (spec 6) and within
   * today's daily limits, each oriented for its direction, with how many
   * are due in total.
   * @throws DeckClubError DECK_NOT_FOUND when the deck is not the caller's, or the API's refusal
   */
  getDueCards(caller: McpCaller, request: DueCardsRequest): Promise<DueCards>;

  /**
   * Records one rating of one card side and schedules its next review with
   * the same FSRS engine as the app (spec 6). The API stamps the review with
   * the AI client's name as its source. It is not idempotent by itself: a
   * second call rates the card again, unless it carries the same key.
   * @throws DeckClubError DECK_NOT_FOUND, CARD_NOT_FOUND, DIRECTION_NOT_STUDIED for the reverse side of a card that is not reversible, VALIDATION_FAILED with field problems, IDEMPOTENCY_KEY_REUSED or IDEMPOTENCY_KEY_IN_USE for the key
   */
  submitReview(
    caller: McpCaller,
    command: SubmitReviewCommand,
    options: { idempotencyKey?: string | undefined },
  ): Promise<RecordedReview>;

  /**
   * The caller's progress (spec 6, stats definitions): streak, reviews today
   * and in total, 30-day retention, and the cards they keep forgetting. What
   * counts as each is the API's rule.
   */
  getStats(caller: McpCaller): Promise<StudyStats>;

  /**
   * Today's workload (spec 4.4, the Today dashboard): due reviews and new
   * cards per deck and in total, within today's limits.
   */
  getToday(caller: McpCaller): Promise<Today>;

  /**
   * One deck of the caller's.
   * @throws DeckClubError DECK_NOT_FOUND when it does not exist or is not theirs
   */
  getDeck(caller: McpCaller, deckId: string): Promise<Deck>;
};

/** Nest injection token for {@link StudyApi}. */
export const STUDY_API = Symbol('STUDY_API');
