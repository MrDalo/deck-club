import type { ReviewResult } from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import { formatReviewRecorded, toReviewRecorded } from './review-recorded-view.js';

const DECK_ID = '00000000-0000-4000-8000-000000000001';
const CARD_ID = '00000000-0000-4000-8000-000000000002';
const AS_OF = '2026-11-17T10:00:00.000Z';
const review = (overrides: Partial<ReviewResult> = {}): ReviewResult => ({
  reviewId: '00000000-0000-4000-8000-000000000003',
  cardId: CARD_ID,
  direction: 'forward',
  rating: 'good',
  state: 'review',
  nextDueAt: '2026-11-20T10:00:00.000Z',
  ...overrides,
});

describe('toReviewRecorded', () => {
  it('keeps the API’s review with the deck, whether it was a replay and when it was given', () => {
    expect(toReviewRecorded({ review: review(), replayed: true }, DECK_ID, AS_OF)).toEqual({
      ...review(),
      deckId: DECK_ID,
      replayed: true,
      asOf: AS_OF,
    });
  });
});

describe('formatReviewRecorded', () => {
  it('says what was recorded for which card and when it comes back', () => {
    const text = formatReviewRecorded(
      toReviewRecorded({ review: review(), replayed: false }, DECK_ID, AS_OF),
    );

    expect(text.split('\n')).toEqual([
      `Recorded "good" for card ${CARD_ID} (forward) in deck ${DECK_ID}. It is now in review and comes back in 3 days (2026-11-20T10:00:00.000Z).`,
      'Go on with the next card.',
    ]);
  });

  it('tells the AI a forgotten card stays in today’s session', () => {
    const text = formatReviewRecorded(
      toReviewRecorded(
        {
          review: review({
            rating: 'again',
            state: 'relearning',
            direction: 'reverse',
            nextDueAt: '2026-11-17T10:10:00.000Z',
          }),
          replayed: false,
        },
        DECK_ID,
        AS_OF,
      ),
    );

    expect(text).toContain('Recorded "again" for card');
    expect(text).toContain('(reverse)');
    expect(text).toContain('It is now in relearning and comes back in 10 min');
    expect(text).toContain('get_due_cards shows it again when it is due');
  });

  it('says first when a retry was answered with the earlier review, so nothing was rated twice', () => {
    const text = formatReviewRecorded(
      toReviewRecorded({ review: review(), replayed: true }, DECK_ID, AS_OF),
    );

    expect(text.split('\n')[0]).toBe(
      'Already done: an earlier submit_review call with this idempotencyKey recorded this rating, so it was not recorded twice.',
    );
  });
});
