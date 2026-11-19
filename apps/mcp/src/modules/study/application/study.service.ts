import type {
  FindWeakSpotsPromptArgs,
  GetDueCardsToolInput,
  GetStatsToolInput,
  QuizMePromptArgs,
  SubmitReviewToolInput,
} from '@deck-club/contracts';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { notImplemented } from '../../../common/errors/deck-club-error.js';
import {
  explainWriteRefusal,
  type WriteRetryAdvice,
} from '../../../common/errors/write-retries.js';
import type { PromptMessageText, ResourceBody } from '../../../common/mcp/content-registration.js';
import type { McpCaller } from '../../../common/mcp/mcp-caller.js';
import type { ToolReply } from '../../../common/mcp/tool-registration.js';
import { ENV, type Env } from '../../../config/env.js';
import { formatDueCards, toDueCards } from './due-cards-view.js';
import { STUDY_API, type StudyApi } from './ports/study-api.js';
import { formatReviewRecorded, toReviewRecorded } from './review-recorded-view.js';
import { formatStats, toStats } from './stats-view.js';

/**
 * How `submit_review` tells the AI to recover from an unconfirmed rating.
 * Without a key the only check is the queue, and a card rated "again" stays
 * in it, so the advice says not to repeat that one.
 */
const SUBMIT_REVIEW_RETRY: WriteRetryAdvice = {
  tool: 'submit_review',
  outcome: 'the rating was recorded',
  check:
    'call get_due_cards and rate the card again only if it is still due (a card rated "again" stays due, so do not repeat an "again")',
};

/**
 * Use cases behind studying in chat (spec 4.5, 6, 9): due cards, reviews,
 * stats, and the "Quiz me" and "Find my weak spots" prompts.
 *
 * Each one calls the API's `/study` endpoints through this module's port
 * with the caller's own token, so a session in the chat goes through the
 * same FSRS engine and daily limits as the app, and holds no rule of its
 * own. The use cases that are not built yet refuse with NOT_IMPLEMENTED.
 */
@Injectable()
export class StudyService {
  private readonly logger = new Logger('mcp.study');

  constructor(
    @Inject(STUDY_API) private readonly api: StudyApi,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /**
   * `get_due_cards`: the next cards due for review, for one deck or all, in
   * session order and within today's limits (spec 6), as text for the AI
   * (answers included, so it can judge the user's reply) and as structured
   * content for the study session view (which hides them until asked).
   *
   * For one deck, the deck is read alongside, so the reply names it even
   * when nothing is due and can tell an empty deck from a finished one.
   * @param caller - the verified user and their AI client
   * @param input - an optional deck and how many cards to return
   * @returns the first due cards and how many are due in total
   * @throws DeckClubError DECK_NOT_FOUND when the deck is not the caller's, or the API's refusal
   */
  async getDueCards(caller: McpCaller, input: GetDueCardsToolInput): Promise<ToolReply> {
    const [due, deck] = await Promise.all([
      this.api.getDueCards(caller, { deckId: input.deckId, limit: input.limit }),
      input.deckId === undefined ? null : this.api.getDeck(caller, input.deckId),
    ]);
    const output = toDueCards(due, deck, this.env.WEB_PUBLIC_URL, new Date().toISOString());
    // Prompts and answers are the user's content: the log keeps the scope and counts.
    this.logger.log({
      evt: 'study.due_read',
      user: caller.userId,
      scope: input.deckId === undefined ? 'all' : 'deck',
      ...(input.deckId !== undefined && { deck: input.deckId }),
      shown: output.cards.length,
      totalDue: output.totalDue,
    });
    return { text: formatDueCards(output), structuredContent: output };
  }

  /**
   * `submit_review`: records how well the user remembered one card side,
   * through the same FSRS engine as the app (spec 4.5, 6), stamped with the
   * AI client as its source, and says when the card comes back. With an
   * idempotency key, a retried call answers with the review the first one
   * recorded (ADR 0009); without one, a second call rates the card twice.
   *
   * The API checks the deck, the card and the side itself, so nothing is
   * read first: a rating in a quiz stays one round trip.
   * @param caller - the verified user and their AI client
   * @param input - the card, the side, the rating and the optional time and key, validated by the contracts schema
   * @returns the recorded review, as text for the AI and as data for the study session view
   * @throws DeckClubError DECK_NOT_FOUND, CARD_NOT_FOUND, DIRECTION_NOT_STUDIED, a refusal about the key or an unconfirmed write explained for the AI, or the API's refusal
   */
  async submitReview(caller: McpCaller, input: SubmitReviewToolInput): Promise<ToolReply> {
    const { idempotencyKey, ...command } = input;
    const recorded = await this.api
      .submitReview(caller, command, { idempotencyKey })
      .catch((error: unknown) => {
        throw explainWriteRefusal(error, SUBMIT_REVIEW_RETRY, idempotencyKey !== undefined);
      });
    const output = toReviewRecorded(recorded, command.deckId, new Date().toISOString());
    // A rating is not card content; the log keeps ids, the rating and the new state.
    this.logger.log({
      evt: 'study.reviewed',
      user: caller.userId,
      deck: output.deckId,
      card: output.cardId,
      direction: output.direction,
      rating: output.rating,
      state: output.state,
      client: caller.clientName,
      replayed: output.replayed,
    });
    return { text: formatReviewRecorded(output), structuredContent: output };
  }

  /**
   * `get_stats`: how the user is doing (spec 6, 9): the streak, today's
   * progress and what is still due per deck, 30-day retention, and the cards
   * they keep forgetting, as text for the AI and as structured content for
   * the stats view. Both reads are the API's, so every number means what it
   * means in the app.
   * @param caller - the verified user and their AI client
   * @param _input - no arguments
   * @returns the user's stats and today's workload
   * @throws DeckClubError when the API refuses the caller's token or cannot be reached
   */
  async getStats(caller: McpCaller, _input: GetStatsToolInput): Promise<ToolReply> {
    const [stats, today] = await Promise.all([
      this.api.getStats(caller),
      this.api.getToday(caller),
    ]);
    const output = toStats(stats, today, this.env.WEB_PUBLIC_URL);
    // Weak cards carry the user's content: the log keeps numbers only.
    this.logger.log({
      evt: 'study.stats_read',
      user: caller.userId,
      streakDays: output.streakDays,
      reviewedToday: output.reviewedToday,
      stillDue: output.dueToday.dueReviews + output.dueToday.newCards,
      weakCards: output.weakCards.length,
    });
    return { text: formatStats(output), structuredContent: output };
  }

  /** Resource `deck-club://study/today`: today's due and new counts per deck. */
  readToday(_caller: McpCaller): Promise<ResourceBody> {
    return notImplemented('The today resource');
  }

  /** Prompt `quiz_me`: a due-card session run in chat. */
  quizMePrompt(_args: QuizMePromptArgs): Promise<PromptMessageText[]> {
    return notImplemented('The "Quiz me" prompt');
  }

  /** Prompt `find_weak_spots`: what the user keeps forgetting, and better cards. */
  findWeakSpotsPrompt(_args: FindWeakSpotsPromptArgs): Promise<PromptMessageText[]> {
    return notImplemented('The "Find my weak spots" prompt');
  }
}
