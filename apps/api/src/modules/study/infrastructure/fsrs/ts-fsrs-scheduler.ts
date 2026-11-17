import { RATINGS, type Rating, STUDY_STATES, type StudyStateName } from '@deck-club/contracts';
import { DefaultScheduler, Rating as FsrsRating } from 'ts-fsrs';
import type { ReviewScheduler, ScheduleRequest } from '../../application/ports/review-scheduler.js';
import type { SchedulingMemory } from '../../domain/study-state.js';

type FsrsScheduler = Awaited<ReturnType<typeof DefaultScheduler>>;
/** The card `review()` accepts (FSRS-7 shape, including `stabilityFast`). */
type FsrsCard = Extract<Parameters<FsrsScheduler['review']>[0]['card'], { stabilityFast: number }>;
/** A card the scheduler returns; `newCard()` types omit `stabilityFast`, which starts at 0. */
type FsrsOutputCard =
  ReturnType<FsrsScheduler['review']>['card'] | ReturnType<FsrsScheduler['newCard']>;
type FsrsGrade = (typeof FsrsRating)['Again' | 'Hard' | 'Good' | 'Easy'];

const GRADE_OF: Record<Rating, FsrsGrade> = {
  again: FsrsRating.Again,
  hard: FsrsRating.Hard,
  good: FsrsRating.Good,
  easy: FsrsRating.Easy,
};

/** ts-fsrs numbers states 0–3 in the same order as STUDY_STATES. */
const stateName = (state: number): StudyStateName => STUDY_STATES[state] ?? 'new';

const SCHEDULE_STATUS: Record<StudyStateName, FsrsCard['scheduleStatus']> = {
  new: 'new',
  learning: 'learning',
  relearning: 'learning',
  review: 'review',
};

function toFsrsCard(memory: SchedulingMemory, scheduleId: string): FsrsCard {
  return {
    cardId: scheduleId,
    state: STUDY_STATES.indexOf(memory.state) as FsrsCard['state'],
    scheduleStatus: SCHEDULE_STATUS[memory.state],
    stability: memory.stability,
    stabilityFast: memory.stabilityFast,
    difficulty: memory.difficulty,
    dueAt: memory.dueAt,
    lastReviewAt: memory.lastReviewAt,
    reps: memory.reps,
    lapses: memory.lapses,
    scheduledDays: memory.scheduledDays,
    learningStep: memory.learningStep,
  };
}

function toMemory(card: FsrsOutputCard): SchedulingMemory {
  return {
    state: stateName(card.state),
    stability: card.stability,
    stabilityFast: 'stabilityFast' in card ? card.stabilityFast : 0,
    difficulty: card.difficulty,
    dueAt: card.dueAt,
    lastReviewAt: card.lastReviewAt,
    reps: card.reps,
    lapses: card.lapses,
    scheduledDays: card.scheduledDays,
    learningStep: card.learningStep,
  };
}

/** Adapter: {@link ReviewScheduler} on ts-fsrs's DefaultScheduler (FSRS-7, ADR 0007). */
export class TsFsrsScheduler implements ReviewScheduler {
  private constructor(private readonly scheduler: FsrsScheduler) {}

  /**
   * Builds the scheduler once at boot (its setup is asynchronous).
   * @param desiredRetention - target recall probability, 0.80–0.97 (spec 6)
   * @returns a ready scheduler
   */
  static async create(desiredRetention: number): Promise<TsFsrsScheduler> {
    // Fuzz off: the interval shown on the rating button must be the interval the review gets.
    return new TsFsrsScheduler(await DefaultScheduler({ desiredRetention, enableFuzz: false }));
  }

  initialMemory(now: Date): SchedulingMemory {
    return toMemory(this.scheduler.newCard({ now }));
  }

  preview(request: ScheduleRequest): Record<Rating, SchedulingMemory> {
    const card = toFsrsCard(request.memory, request.scheduleId);
    const entries = RATINGS.map((rating) => {
      const outcome = this.scheduler.review({ card, grade: GRADE_OF[rating], now: request.now });
      return [rating, toMemory(outcome.card)] as const;
    });
    return Object.fromEntries(entries) as Record<Rating, SchedulingMemory>;
  }

  review(request: ScheduleRequest, rating: Rating): SchedulingMemory {
    const card = toFsrsCard(request.memory, request.scheduleId);
    return toMemory(
      this.scheduler.review({ card, grade: GRADE_OF[rating], now: request.now }).card,
    );
  }
}
