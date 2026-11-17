import { RATINGS, type Rating, STUDY_STATES, type StudyStateName } from '@deck-club/contracts';
import {
  type Card as FsrsCard,
  createEmptyCard,
  fsrs,
  type FSRS,
  generatorParameters,
  type Grade,
  Rating as FsrsRating,
  type State,
} from 'ts-fsrs';
import type { ReviewScheduler, ScheduleRequest } from '../../application/ports/review-scheduler.js';
import type { SchedulingMemory } from '../../domain/study-state.js';

const GRADE_OF: Record<Rating, Grade> = {
  again: FsrsRating.Again,
  hard: FsrsRating.Hard,
  good: FsrsRating.Good,
  easy: FsrsRating.Easy,
};

/** ts-fsrs numbers states 0–3 in the same order as STUDY_STATES. */
const stateName = (state: State): StudyStateName => STUDY_STATES[state] ?? 'new';

function toFsrsCard(memory: SchedulingMemory): FsrsCard {
  return {
    due: memory.dueAt,
    stability: memory.stability,
    difficulty: memory.difficulty,
    // Deprecated in ts-fsrs 5: the scheduler derives elapsed time from `last_review`.
    elapsed_days: 0,
    scheduled_days: memory.scheduledDays,
    learning_steps: memory.learningStep,
    reps: memory.reps,
    lapses: memory.lapses,
    state: STUDY_STATES.indexOf(memory.state),
    ...(memory.lastReviewAt !== null && { last_review: memory.lastReviewAt }),
  };
}

function toMemory(card: FsrsCard): SchedulingMemory {
  return {
    state: stateName(card.state),
    stability: card.stability,
    // FSRS-7 only; FSRS-6 has a single stability. Kept so moving to FSRS-7 needs no migration.
    stabilityFast: 0,
    difficulty: card.difficulty,
    dueAt: card.due,
    lastReviewAt: card.last_review ?? null,
    reps: card.reps,
    lapses: card.lapses,
    scheduledDays: card.scheduled_days,
    learningStep: card.learning_steps,
  };
}

/** Adapter: {@link ReviewScheduler} on ts-fsrs 5 (FSRS-6, ADR 0007). */
export class TsFsrsScheduler implements ReviewScheduler {
  private constructor(private readonly scheduler: FSRS) {}

  /**
   * Builds the scheduler.
   * @param desiredRetention - target recall probability, 0.80–0.97 (spec 6)
   * @returns a ready scheduler
   */
  static create(desiredRetention: number): TsFsrsScheduler {
    // Fuzz off: the interval shown on the rating button must be the interval the review gets.
    const parameters = generatorParameters({
      request_retention: desiredRetention,
      enable_fuzz: false,
    });
    return new TsFsrsScheduler(fsrs(parameters));
  }

  initialMemory(now: Date): SchedulingMemory {
    return toMemory(createEmptyCard(now));
  }

  preview(request: ScheduleRequest): Record<Rating, SchedulingMemory> {
    const card = toFsrsCard(request.memory);
    const entries = RATINGS.map((rating) => {
      const outcome = this.scheduler.next(card, request.now, GRADE_OF[rating]);
      return [rating, toMemory(outcome.card)] as const;
    });
    return Object.fromEntries(entries) as Record<Rating, SchedulingMemory>;
  }

  review(request: ScheduleRequest, rating: Rating): SchedulingMemory {
    const card = toFsrsCard(request.memory);
    return toMemory(this.scheduler.next(card, request.now, GRADE_OF[rating]).card);
  }
}
