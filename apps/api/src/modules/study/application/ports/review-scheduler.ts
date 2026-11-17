import type { Rating } from '@deck-club/contracts';
import type { SchedulingMemory } from '../../domain/study-state.js';

/** What the scheduler needs to identify a schedule (it seeds interval fuzzing per card). */
export type ScheduleRequest = {
  memory: SchedulingMemory;
  now: Date;
  scheduleId: string;
};

/**
 * Port: the spaced-repetition engine (spec 6: a maintained FSRS
 * implementation, never a home-made algorithm). Pure computation; every
 * entry point — app, MCP, battles — goes through the same instance.
 */
export type ReviewScheduler = {
  /** The memory of a card never reviewed. */
  initialMemory(now: Date): SchedulingMemory;
  /** The memory after each possible rating, for the next-interval hints. */
  preview(request: ScheduleRequest): Record<Rating, SchedulingMemory>;
  /** The memory after the given rating. */
  review(request: ScheduleRequest, rating: Rating): SchedulingMemory;
};

/** Nest injection token for {@link ReviewScheduler}. */
export const REVIEW_SCHEDULER = Symbol('REVIEW_SCHEDULER');
