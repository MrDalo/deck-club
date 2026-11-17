import { Inject, Injectable } from '@nestjs/common';
import {
  type Provenance,
  type ReviewResult,
  STUDY_DEFAULTS,
  type SubmitReviewCommand,
  type UndoResult,
} from '@deck-club/contracts';
import { AppError } from '../../../common/errors/app-error.js';
import { TIME_AND_IDS, type TimeAndIds } from '../../../common/time-and-ids.js';
import { DecksFacade } from '../../decks/decks.facade.js';
import { studyDayOf } from '../domain/study-day.js';
import { type Review, studiedDirections, studyKeyOf } from '../domain/study-state.js';
import { REVIEW_SCHEDULER, type ReviewScheduler } from './ports/review-scheduler.js';
import { STUDY_REPOSITORY, type StudyRepository } from './ports/study-repository.js';

/** A review to record: who, what, and through which client. */
export type ReviewRequest = {
  userId: string;
  command: SubmitReviewCommand;
  provenance: Provenance;
};

/**
 * Writes to the study log. Every review, from the app or an AI client, goes
 * through the same scheduler and updates the same schedule (spec 4.5, 6).
 */
@Injectable()
export class ReviewService {
  constructor(
    private readonly decks: DecksFacade,
    @Inject(STUDY_REPOSITORY) private readonly study: StudyRepository,
    @Inject(REVIEW_SCHEDULER) private readonly scheduler: ReviewScheduler,
    @Inject(TIME_AND_IDS) private readonly runtime: TimeAndIds,
  ) {}

  /** Rates one card side and schedules its next review. */
  async submit(request: ReviewRequest): Promise<ReviewResult> {
    const { userId, command, provenance } = request;
    const card = await this.decks.getManagedCard(userId, command.deckId, command.cardId);
    if (!studiedDirections(card.type).includes(command.direction)) {
      throw new AppError(
        'DIRECTION_NOT_STUDIED',
        'Only reversible cards are studied in the reverse direction.',
      );
    }
    const now = this.runtime.clock.now();
    const key = { cardId: card.id, direction: command.direction };
    const current = await this.study.findState(userId, key);
    const memory = current?.memory ?? this.scheduler.initialMemory(now);
    const nextMemory = this.scheduler.review(
      { memory, now, scheduleId: studyKeyOf(key) },
      command.rating,
    );
    const review: Review = {
      ...key,
      id: this.runtime.ids.next(),
      userId,
      deckId: card.deckId,
      rating: command.rating,
      source: provenance.source,
      clientName: provenance.clientName,
      durationMs: command.durationMs ?? null,
      reviewedAt: now,
      previousMemory: current?.memory ?? null,
      undoneAt: null,
    };
    await this.study.recordReview(review, {
      ...key,
      userId,
      deckId: card.deckId,
      memory: nextMemory,
      suspended: current?.suspended ?? false,
      updatedAt: now,
    });
    return {
      reviewId: review.id,
      cardId: card.id,
      direction: command.direction,
      rating: command.rating,
      state: nextMemory.state,
      nextDueAt: nextMemory.dueAt.toISOString(),
    };
  }

  /** Takes back the user's last rating of today and restores the exact previous schedule (spec 4.4). */
  async undoLast(userId: string): Promise<UndoResult> {
    const now = this.runtime.clock.now();
    const latest = await this.study.findLatestReview(userId);
    const today = studyDayOf(now, STUDY_DEFAULTS.dayStartHour);
    if (latest === null || latest.reviewedAt < today.start) {
      throw new AppError('NOTHING_TO_UNDO', 'There is no rating from today to undo.');
    }
    await this.study.undoReview(latest, now);
    return {
      reviewId: latest.id,
      deckId: latest.deckId,
      cardId: latest.cardId,
      direction: latest.direction,
    };
  }
}
