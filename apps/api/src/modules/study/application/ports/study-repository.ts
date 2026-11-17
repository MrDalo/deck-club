import type { Review, StudyKey, StudyState } from '../../domain/study-state.js';

/** Port: schedules and the append-only review log. Reads skip undone reviews. */
export type StudyRepository = {
  /** The user's schedules for the given cards (any direction). */
  listStates(userId: string, cardIds: readonly string[]): Promise<StudyState[]>;
  findState(userId: string, key: StudyKey): Promise<StudyState | null>;
  /** Appends the review and saves the new schedule, atomically. */
  recordReview(review: Review, nextState: StudyState): Promise<void>;
  /** The user's most recent review that has not been undone. */
  findLatestReview(userId: string): Promise<Review | null>;
  /**
   * Marks the review undone and restores its `previousMemory` (or removes the
   * schedule when it was the first review), atomically.
   */
  undoReview(review: Review, undoneAt: Date): Promise<void>;
  listReviewsSince(userId: string, since: Date): Promise<Review[]>;
  countReviews(userId: string): Promise<number>;
};

/** Nest injection token for {@link StudyRepository}. */
export const STUDY_REPOSITORY = Symbol('STUDY_REPOSITORY');
