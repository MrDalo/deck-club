import { describe, expect, it } from 'vitest';
import {
  DueCardsQuerySchema,
  STUDY_DEFAULTS,
  StudyStatsSchema,
  SubmitReviewInputSchema,
  WEAK_CARD_RULE,
} from './study.js';

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

describe('StudyStatsSchema', () => {
  const weak = {
    deckId: '00000000-0000-4000-8000-000000000001',
    deckTitle: 'Spanish',
    cardId: '00000000-0000-4000-8000-000000000002',
    direction: 'reverse',
    cardType: 'reversible',
    prompt: 'to speak',
    answer: 'hablar',
    extra: '',
    forgotten: 3,
    lastForgottenAt: '2026-11-16T10:00:00.000Z',
  };
  const stats = {
    streakDays: 4,
    reviewedToday: 12,
    totalReviews: 230,
    retention30d: 0.87,
    weakCards: [weak],
  };

  it('accepts stats with the cards the user keeps forgetting', () => {
    expect(StudyStatsSchema.parse(stats)).toEqual(stats);
  });

  it('accepts a user with no retention yet and no weak cards', () => {
    expect(
      StudyStatsSchema.safeParse({ ...stats, retention30d: null, weakCards: [] }).success,
    ).toBe(true);
  });

  it('rejects a card forgotten fewer times than the rule calls weak', () => {
    expect(
      StudyStatsSchema.safeParse({
        ...stats,
        weakCards: [{ ...weak, forgotten: WEAK_CARD_RULE.minForgotten - 1 }],
      }).success,
    ).toBe(false);
  });

  it('rejects more weak cards than the stats show', () => {
    const weakCards = Array.from({ length: WEAK_CARD_RULE.shown + 1 }, () => weak);

    expect(StudyStatsSchema.safeParse({ ...stats, weakCards }).success).toBe(false);
  });
});
