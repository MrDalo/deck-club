import type {
  Deck,
  DueCard,
  DueCards,
  Rating,
  ReviewResult,
  StudyStats,
  SubmitReviewCommand,
  Today,
  WeakCard,
} from '@deck-club/contracts';
import { DeckClubError } from '../../../common/errors/deck-club-error.js';
import type { McpCaller } from '../../../common/mcp/mcp-caller.js';
import type { DueCardsRequest, RecordedReview, StudyApi } from '../application/ports/study-api.js';

/** The deck every due card of the fixtures is in, unless a test says otherwise. */
export const STUDY_DECK_ID = '00000000-0000-4000-8000-0000000000e1';

/**
 * A deck as the API returns it, with everything but the given fields filled in.
 * @param deck - the fields that matter to the test
 * @returns the deck
 */
export function testStudyDeck(deck: Partial<Deck> = {}): Deck {
  return {
    id: STUDY_DECK_ID,
    title: 'Spanish verbs',
    description: '',
    language: 'es',
    tags: [],
    visibility: 'private',
    cardCount: 30,
    createdAt: '2026-11-17T10:00:00.000Z',
    updatedAt: '2026-11-17T10:00:00.000Z',
    ...deck,
  };
}

/**
 * A due card as the API returns it, with everything but the given fields filled in.
 * @param card - the fields that matter to the test
 * @returns the card
 */
export function testDueCard(card: Partial<DueCard> & Pick<DueCard, 'cardId'>): DueCard {
  return {
    deckId: STUDY_DECK_ID,
    deckTitle: 'Spanish verbs',
    direction: 'forward',
    cardType: 'basic',
    state: 'new',
    prompt: 'hablar',
    answer: 'to speak',
    extra: '',
    nextDue: {
      again: '2026-11-17T10:01:00.000Z',
      hard: '2026-11-17T10:06:00.000Z',
      good: '2026-11-17T10:10:00.000Z',
      easy: '2026-11-20T10:00:00.000Z',
    },
    ...card,
  };
}

/** Stats before any review: what a new user's `GET /study/stats` answers. */
const NO_STATS: StudyStats = {
  streakDays: 0,
  reviewedToday: 0,
  totalReviews: 0,
  retention30d: null,
  weakCards: [],
};

/** Nothing due and no decks: what a new user's `GET /study/today` answers. */
const NOTHING_TODAY: Today = {
  decks: [],
  totals: { dueReviews: 0, newCards: 0 },
  reviewedToday: 0,
  streakDays: 0,
};

/**
 * A weak card as the API returns it, with everything but the given fields filled in.
 * @param card - the fields that matter to the test
 * @returns the card
 */
export function testWeakCard(card: Partial<WeakCard> & Pick<WeakCard, 'cardId'>): WeakCard {
  return {
    deckId: STUDY_DECK_ID,
    deckTitle: 'Spanish verbs',
    direction: 'forward',
    cardType: 'basic',
    prompt: 'hablar',
    answer: 'to speak',
    extra: '',
    forgotten: 3,
    lastForgottenAt: '2026-11-16T10:00:00.000Z',
    ...card,
  };
}

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

/**
 * When the fake schedules a card after each rating, from now: a stand-in for
 * FSRS, which the API owns and tests. "again" and "hard" keep it in learning.
 */
const FAKE_SCHEDULE: Readonly<Record<Rating, { afterMs: number; state: ReviewResult['state'] }>> = {
  again: { afterMs: MINUTE_MS, state: 'learning' },
  hard: { afterMs: 6 * MINUTE_MS, state: 'learning' },
  good: { afterMs: 3 * DAY_MS, state: 'review' },
  easy: { afterMs: 8 * DAY_MS, state: 'review' },
};

/**
 * In-memory {@link StudyApi}: one study queue and one library per access
 * token, refusing other people's decks like the API. The queue is served as
 * the API would: one deck's cards or all, the first `limit` of them, and the
 * total due. The fake does not schedule: the session order is the API's.
 */
export class FakeStudyApi implements StudyApi {
  readonly callers: McpCaller[] = [];
  /** Every due-cards request, as sent. */
  readonly dueRequests: DueCardsRequest[] = [];
  private readonly queues = new Map<string, DueCard[]>();
  private readonly libraries = new Map<string, Deck[]>();
  private failure: DeckClubError | null = null;
  private writeFailure: DeckClubError | null = null;
  /** Every review `submitReview` was asked to record, refused or not. */
  readonly reviews: SubmitReviewCommand[] = [];
  /** The idempotency key of every review, `undefined` when the AI sent none. */
  readonly idempotencyKeys: (string | undefined)[] = [];
  private readonly answered = new Map<string, { request: string; review: ReviewResult }>();
  private readonly stats = new Map<string, StudyStats>();
  private readonly todays = new Map<string, Today>();

  /** Gives the owner of `accessToken` these decks. */
  withDecks(accessToken: string, decks: Deck[]): this {
    this.libraries.set(accessToken, decks);
    return this;
  }

  /** Makes these cards due now for the owner of `accessToken`, in session order. */
  withDueCards(accessToken: string, cards: DueCard[]): this {
    this.queues.set(accessToken, cards);
    return this;
  }

  /** Makes every call refuse, as the API would. */
  failWith(error: DeckClubError): this {
    this.failure = error;
    return this;
  }

  /** What `getStats` answers the owner of `accessToken`; no reviews otherwise. */
  withStats(accessToken: string, stats: Partial<StudyStats>): this {
    this.stats.set(accessToken, { ...NO_STATS, ...stats });
    return this;
  }

  /** What `getToday` answers the owner of `accessToken`; nothing due otherwise. */
  withToday(accessToken: string, today: Partial<Today>): this {
    this.todays.set(accessToken, { ...NOTHING_TODAY, ...today });
    return this;
  }

  getStats(caller: McpCaller): Promise<StudyStats> {
    this.callers.push(caller);
    if (this.failure !== null) return Promise.reject(this.failure);
    return Promise.resolve(this.stats.get(caller.accessToken) ?? NO_STATS);
  }

  getToday(caller: McpCaller): Promise<Today> {
    this.callers.push(caller);
    if (this.failure !== null) return Promise.reject(this.failure);
    return Promise.resolve(this.todays.get(caller.accessToken) ?? NOTHING_TODAY);
  }

  /** Makes `submitReview` refuse, after the deck was found, as the API would. */
  failReviewsWith(error: DeckClubError): this {
    this.writeFailure = error;
    return this;
  }

  /**
   * Records a review like the API: the deck must be the caller's, the card
   * one of their due cards, the reverse side only for a reversible card; a
   * retry with the same key and review is answered with the first review,
   * another review with the key is refused (ADR 0009).
   */
  async submitReview(
    caller: McpCaller,
    command: SubmitReviewCommand,
    options: { idempotencyKey?: string | undefined },
  ): Promise<RecordedReview> {
    this.callers.push(caller);
    this.reviews.push(command);
    this.idempotencyKeys.push(options.idempotencyKey);
    await this.owned(caller, command.deckId);
    if (this.writeFailure !== null) throw this.writeFailure;
    const card = (this.queues.get(caller.accessToken) ?? []).find(
      (each) => each.deckId === command.deckId && each.cardId === command.cardId,
    );
    if (card === undefined)
      throw new DeckClubError('CARD_NOT_FOUND', 'No card with that id exists in this deck.');
    if (command.direction === 'reverse' && card.cardType !== 'reversible')
      throw new DeckClubError(
        'DIRECTION_NOT_STUDIED',
        'Only reversible cards are studied in the reverse direction.',
      );
    return this.once(caller, options.idempotencyKey, command, () => this.schedule(command));
  }

  private once(
    caller: McpCaller,
    key: string | undefined,
    command: SubmitReviewCommand,
    record: () => ReviewResult,
  ): RecordedReview {
    if (key === undefined) return { review: record(), replayed: false };
    const slot = `${caller.accessToken} ${key}`;
    const request = JSON.stringify(command);
    const earlier = this.answered.get(slot);
    if (earlier === undefined) {
      const review = record();
      this.answered.set(slot, { request, review });
      return { review, replayed: false };
    }
    if (earlier.request !== request)
      throw new DeckClubError(
        'IDEMPOTENCY_KEY_REUSED',
        'This Idempotency-Key was already used for a different request. Use a new key for a new request.',
      );
    return { review: earlier.review, replayed: true };
  }

  private schedule(command: SubmitReviewCommand): ReviewResult {
    const { afterMs, state } = FAKE_SCHEDULE[command.rating];
    return {
      reviewId: `00000000-0000-4000-8000-${String(500 + this.answered.size + this.reviews.length).padStart(12, '0')}`,
      cardId: command.cardId,
      direction: command.direction,
      rating: command.rating,
      state,
      nextDueAt: new Date(Date.now() + afterMs).toISOString(),
    };
  }

  async getDueCards(caller: McpCaller, request: DueCardsRequest): Promise<DueCards> {
    this.callers.push(caller);
    this.dueRequests.push(request);
    if (request.deckId !== undefined) await this.owned(caller, request.deckId);
    else if (this.failure !== null) throw this.failure;
    const queue = (this.queues.get(caller.accessToken) ?? []).filter(
      (card) => request.deckId === undefined || card.deckId === request.deckId,
    );
    return { cards: queue.slice(0, request.limit), totalDue: queue.length };
  }

  getDeck(caller: McpCaller, deckId: string): Promise<Deck> {
    this.callers.push(caller);
    return this.owned(caller, deckId);
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
