import type { StudyRepository } from '../../application/ports/study-repository.js';
import {
  type Review,
  type StudyKey,
  type StudyState,
  studyKeyOf,
} from '../../domain/study-state.js';

/** Test adapter for {@link StudyRepository}; use-case tests use it, never an ad-hoc mock. */
export class InMemoryStudyRepository implements StudyRepository {
  readonly states = new Map<string, StudyState>();
  readonly reviews: Review[] = [];

  listStates(userId: string, cardIds: readonly string[]): Promise<StudyState[]> {
    const wanted = new Set(cardIds);
    return Promise.resolve(
      [...this.states.values()].filter(
        (state) => state.userId === userId && wanted.has(state.cardId),
      ),
    );
  }

  findState(userId: string, key: StudyKey): Promise<StudyState | null> {
    return Promise.resolve(this.states.get(this.stateKey(userId, key)) ?? null);
  }

  recordReview(review: Review, nextState: StudyState): Promise<void> {
    this.reviews.push(review);
    this.states.set(this.stateKey(nextState.userId, nextState), nextState);
    return Promise.resolve();
  }

  findLatestReview(userId: string): Promise<Review | null> {
    const active = this.active(userId);
    return Promise.resolve(active.at(-1) ?? null);
  }

  undoReview(review: Review, undoneAt: Date): Promise<void> {
    const index = this.reviews.findIndex((candidate) => candidate.id === review.id);
    const stored = this.reviews[index];
    if (stored !== undefined) this.reviews[index] = { ...stored, undoneAt };
    const key = this.stateKey(review.userId, review);
    const current = this.states.get(key);
    if (review.previousMemory === null || current === undefined) this.states.delete(key);
    else this.states.set(key, { ...current, memory: review.previousMemory, updatedAt: undoneAt });
    return Promise.resolve();
  }

  listReviewsSince(userId: string, since: Date): Promise<Review[]> {
    return Promise.resolve(this.active(userId).filter((review) => review.reviewedAt >= since));
  }

  countReviews(userId: string): Promise<number> {
    return Promise.resolve(this.active(userId).length);
  }

  private active(userId: string): Review[] {
    return this.reviews
      .filter((review) => review.userId === userId && review.undoneAt === null)
      .sort((first, second) => first.reviewedAt.getTime() - second.reviewedAt.getTime());
  }

  private stateKey(userId: string, key: StudyKey): string {
    return `${userId}:${studyKeyOf(key)}`;
  }
}
