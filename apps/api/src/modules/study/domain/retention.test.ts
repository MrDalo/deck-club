import type { Rating, StudyStateName } from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import { retentionOf } from './retention.js';
import type { Review } from './study-state.js';

function review(previous: StudyStateName | null, rating: Rating): Review {
  const reviewedAt = new Date('2026-11-17T10:00:00Z');
  return {
    id: 'r',
    userId: 'ana',
    deckId: 'd',
    cardId: 'c',
    direction: 'forward',
    rating,
    source: 'app',
    clientName: null,
    durationMs: null,
    reviewedAt,
    previousMemory:
      previous === null
        ? null
        : {
            state: previous,
            stability: 1,
            stabilityFast: 1,
            difficulty: 5,
            dueAt: reviewedAt,
            lastReviewAt: null,
            reps: 1,
            lapses: 0,
            scheduledDays: 1,
            learningStep: 0,
          },
    undoneAt: null,
  };
}

describe('retentionOf', () => {
  it('is the share of review-state cards not rated again', () => {
    const reviews = [
      review('review', 'good'),
      review('review', 'hard'),
      review('review', 'easy'),
      review('review', 'again'),
    ];

    expect(retentionOf(reviews)).toBe(0.75);
  });

  it('ignores new and learning cards', () => {
    expect(
      retentionOf([review(null, 'again'), review('learning', 'again'), review('review', 'good')]),
    ).toBe(1);
  });

  it('is null when no review-state card was reviewed', () => {
    expect(retentionOf([review(null, 'good')])).toBeNull();
  });
});
