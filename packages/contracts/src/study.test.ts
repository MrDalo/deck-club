import { describe, expect, it } from 'vitest';
import { DueCardsQuerySchema, STUDY_DEFAULTS, SubmitReviewInputSchema } from './study.js';

const ids = {
  deckId: '00000000-0000-4000-8000-000000000001',
  cardId: '00000000-0000-4000-8000-000000000002',
};

describe('SubmitReviewInputSchema', () => {
  it('defaults the direction to forward', () => {
    expect(SubmitReviewInputSchema.parse({ ...ids, rating: 'good' }).direction).toBe('forward');
  });

  it('rejects a rating outside again, hard, good, easy', () => {
    expect(SubmitReviewInputSchema.safeParse({ ...ids, rating: 'perfect' }).success).toBe(false);
  });

  it('rejects a duration over one hour', () => {
    expect(
      SubmitReviewInputSchema.safeParse({ ...ids, rating: 'good', durationMs: 3_600_001 }).success,
    ).toBe(false);
  });
});

describe('DueCardsQuerySchema', () => {
  it('coerces the limit from a query string and defaults it to 20', () => {
    expect(DueCardsQuerySchema.parse({ limit: '5' }).limit).toBe(5);
    expect(DueCardsQuerySchema.parse({}).limit).toBe(20);
  });

  it('caps the limit at the per-request maximum', () => {
    const tooMany = String(STUDY_DEFAULTS.maxDueCardsPerRequest + 1);

    expect(DueCardsQuerySchema.safeParse({ limit: tooMany }).success).toBe(false);
  });
});
