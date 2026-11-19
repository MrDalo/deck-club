import {
  type DueCard,
  IdempotencyKeySchema,
  type SubmitReviewOutput,
  SubmitReviewToolInputSchema,
} from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import {
  nextCardsArguments,
  parseRateValue,
  ratedCount,
  ratingsContext,
  rateValue,
  readDueCards,
  readReview,
  reviewArguments,
  sessionId,
  type StudySession,
  withReview,
} from './study-session-state.js';

const SPANISH = '00000000-0000-4000-8000-0000000000d1';
const AS_OF = '2026-11-17T10:00:00.000Z';
const card = (index: number, overrides: Partial<DueCard> = {}): DueCard => ({
  deckId: SPANISH,
  deckTitle: 'Spanish',
  cardId: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
  direction: 'forward',
  cardType: 'basic',
  state: 'new',
  prompt: `hablar ${index}`,
  answer: `to speak ${index}`,
  extra: '',
  nextDue: {
    again: '2026-11-17T10:01:00.000Z',
    hard: '2026-11-17T10:06:00.000Z',
    good: '2026-11-17T10:10:00.000Z',
    easy: '2026-11-20T10:00:00.000Z',
  },
  ...overrides,
});
const session = (overrides: Partial<StudySession> = {}): StudySession => ({
  deck: null,
  cards: [card(1), card(2, { direction: 'reverse', cardType: 'reversible' })],
  totalDue: 2,
  libraryUrl: 'https://deck.club/decks',
  asOf: AS_OF,
  ...overrides,
});
const reviewOf = (
  rated: DueCard,
  overrides: Partial<SubmitReviewOutput> = {},
): SubmitReviewOutput => ({
  reviewId: '00000000-0000-4000-8000-000000000099',
  deckId: rated.deckId,
  cardId: rated.cardId,
  direction: rated.direction,
  rating: 'good',
  state: 'review',
  nextDueAt: '2026-11-20T10:00:00.000Z',
  replayed: false,
  asOf: AS_OF,
  ...overrides,
});

describe('rateValue and parseRateValue', () => {
  it('carry the card’s place and the rating on a button, and read them back', () => {
    expect(rateValue(3, 'hard')).toBe('3:hard');
    expect(parseRateValue('3:hard')).toEqual({ index: 3, rating: 'hard' });
  });

  it.each(['3:perfect', 'x:good', '-1:good', '1.5:good', 'good', ''])(
    'refuse "%s", which no button carries',
    (value) => {
      expect(parseRateValue(value)).toBeNull();
    },
  );
});

describe('reviewArguments', () => {
  it('rates the card on the side it was asked, with a key for this session and card', () => {
    const args = reviewArguments(session(), 1, 'easy');

    expect(args).toEqual({
      deckId: SPANISH,
      cardId: card(2).cardId,
      direction: 'reverse',
      rating: 'easy',
      idempotencyKey: `view-${Date.parse(AS_OF)}-${card(2).cardId}-reverse`,
    });
    expect(SubmitReviewToolInputSchema.safeParse(args).success).toBe(true);
    expect(IdempotencyKeySchema.safeParse(args?.idempotencyKey).success).toBe(true);
  });

  it('keeps the key whatever the rating, so a second press never rates the card twice', () => {
    expect(reviewArguments(session(), 0, 'again')?.idempotencyKey).toBe(
      reviewArguments(session(), 0, 'easy')?.idempotencyKey,
    );
  });

  it('gives the same card a new key in a later session', () => {
    const later = session({ asOf: '2026-11-18T10:00:00.000Z' });

    expect(reviewArguments(later, 0, 'good')?.idempotencyKey).not.toBe(
      reviewArguments(session(), 0, 'good')?.idempotencyKey,
    );
  });

  it('has nothing to send for a place past the last card', () => {
    expect(reviewArguments(session(), 2, 'good')).toBeNull();
  });
});

describe('withReview and ratedCount', () => {
  it('adds the review to the session, keeping the earlier ones', () => {
    const once = withReview(session(), 0, reviewOf(card(1)));
    const twice =
      once === null ? null : withReview(once, 1, reviewOf(card(2, { direction: 'reverse' })));

    expect(twice?.reviewed?.[0]?.cardId).toBe(card(1).cardId);
    expect(twice?.reviewed?.[1]?.direction).toBe('reverse');
    expect(twice === null ? 0 : ratedCount(twice)).toBe(2);
    expect(ratedCount(session())).toBe(0);
  });

  it('refuses a review of another card or side, so a mixed-up answer is never shown', () => {
    expect(withReview(session(), 0, reviewOf(card(2)))).toBeNull();
    expect(withReview(session(), 1, reviewOf(card(2), { direction: 'forward' }))).toBeNull();
  });
});

describe('nextCardsArguments', () => {
  it('asks every deck for as many cards as before', () => {
    expect(nextCardsArguments(session())).toEqual({ limit: 2 });
  });

  it('stays in the deck of a one-deck session', () => {
    const deck = { id: SPANISH, title: 'Spanish', url: 'https://deck.club/decks/x', cardCount: 9 };

    expect(nextCardsArguments(session({ deck, cards: [card(1)] }))).toEqual({
      deckId: SPANISH,
      limit: 1,
    });
  });
});

describe('ratingsContext', () => {
  it('has nothing to tell the assistant before the first rating', () => {
    expect(ratingsContext(session())).toBeNull();
  });

  it('lists every card rated in the view, so the assistant neither asks nor records it again', () => {
    const text = ratingsContext(
      session({
        reviewed: {
          1: reviewOf(card(2, { direction: 'reverse' }), {
            rating: 'again',
            nextDueAt: '2026-11-17T10:01:00.000Z',
          }),
        },
      }),
    );

    expect(text?.split('\n')).toEqual([
      'The user rated these cards themselves in the Deck Club study view. The ratings are recorded: do not ask these cards again and do not call submit_review for them.',
      `- "hablar 2" (deck id: ${SPANISH}, card id: ${card(2).cardId}, direction: reverse): again, back in 1 min`,
    ]);
  });
});

describe('sessionId', () => {
  it('is the moment the cards were read, as digits', () => {
    expect(sessionId(session())).toBe(String(Date.parse(AS_OF)));
  });
});

describe('readReview and readDueCards', () => {
  it('read what the view fetched itself, and give up on refusals and broken results', () => {
    const review = reviewOf(card(1));
    const { reviewed: _reviewed, ...dueCards } = session();

    expect(readReview({ structuredContent: review })).toEqual(review);
    expect(readReview({ isError: true, structuredContent: review })).toBeNull();
    expect(readReview({ structuredContent: { rating: 'good' } })).toBeNull();
    expect(readDueCards({ structuredContent: dueCards })).toEqual(dueCards);
    expect(readDueCards({ structuredContent: { cards: [] } })).toBeNull();
  });
});
