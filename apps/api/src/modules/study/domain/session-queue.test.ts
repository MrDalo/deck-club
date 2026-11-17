import type { CardType, StudyDirection, StudyStateName } from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import { buildSessionQueue, type QueueInput } from './session-queue.js';
import { studyDayOf } from './study-day.js';
import type { Review, SchedulingMemory, StudyCard, StudyState } from './study-state.js';

const now = new Date('2026-11-17T10:00:00Z');
const minutes = (count: number): Date => new Date(now.getTime() + count * 60_000);

function card(
  cardId: string,
  options: { deckId?: string; cardType?: CardType; addedMinute?: number } = {},
): StudyCard {
  return {
    deckId: options.deckId ?? 'deck-a',
    deckTitle: 'Deck',
    cardId,
    cardType: options.cardType ?? 'basic',
    front: `${cardId} front`,
    back: `${cardId} back`,
    extra: '',
    createdAt: minutes(-1000 + (options.addedMinute ?? 0)),
  };
}

function memory(state: StudyStateName, dueAt: Date): SchedulingMemory {
  return {
    state,
    stability: 1,
    stabilityFast: 1,
    difficulty: 5,
    dueAt,
    lastReviewAt: minutes(-60),
    reps: 1,
    lapses: 0,
    scheduledDays: 1,
    learningStep: 0,
  };
}

function state(
  cardId: string,
  mem: SchedulingMemory,
  direction: StudyDirection = 'forward',
): StudyState {
  return {
    userId: 'ana',
    deckId: 'deck-a',
    cardId,
    direction,
    memory: mem,
    suspended: false,
    updatedAt: minutes(-60),
  };
}

function review(
  cardId: string,
  options: { direction?: StudyDirection; first?: boolean; deckId?: string } = {},
): Review {
  return {
    id: `review-${cardId}`,
    userId: 'ana',
    deckId: options.deckId ?? 'deck-a',
    cardId,
    direction: options.direction ?? 'forward',
    rating: 'good',
    source: 'app',
    clientName: null,
    durationMs: null,
    reviewedAt: minutes(-5),
    previousMemory: options.first === true ? null : memory('review', minutes(-10)),
    undoneAt: null,
  };
}

function queueOf(
  partial: Partial<QueueInput>,
): { cardId: string; bucket: string; direction: string }[] {
  const input: QueueInput = {
    cards: [],
    states: [],
    reviewsToday: [],
    now,
    today: studyDayOf(now, 4),
    limits: { newCardsPerDeck: 20, reviewsPerDeck: 200 },
    ...partial,
  };
  return buildSessionQueue(input).map((entry) => ({
    cardId: entry.card.cardId,
    bucket: entry.bucket,
    direction: entry.direction,
  }));
}

describe('buildSessionQueue', () => {
  it('orders due learning, then reviews most overdue first, then new cards, then learn-ahead', () => {
    const queue = queueOf({
      cards: [
        card('new-1'),
        card('review-late'),
        card('review-later'),
        card('learning'),
        card('soon'),
      ],
      states: [
        state('review-late', memory('review', minutes(-60 * 24))),
        state('review-later', memory('review', minutes(-60))),
        state('learning', memory('learning', minutes(-1))),
        state('soon', memory('relearning', minutes(10))),
      ],
    });

    expect(queue.map((entry) => entry.cardId)).toEqual([
      'learning',
      'review-late',
      'review-later',
      'new-1',
      'soon',
    ]);
  });

  it('shows review cards due later today but not tomorrow', () => {
    const queue = queueOf({
      cards: [card('later-today'), card('tomorrow')],
      states: [
        state('later-today', memory('review', minutes(60 * 10))),
        state('tomorrow', memory('review', minutes(60 * 20))),
      ],
    });

    expect(queue.map((entry) => entry.cardId)).toEqual(['later-today']);
  });

  it('introduces new cards in the order they were added, up to the daily limit per deck', () => {
    const queue = queueOf({
      cards: [
        card('third', { addedMinute: 3 }),
        card('first', { addedMinute: 1 }),
        card('second', { addedMinute: 2 }),
      ],
      limits: { newCardsPerDeck: 2, reviewsPerDeck: 200 },
    });

    expect(queue.map((entry) => entry.cardId)).toEqual(['first', 'second']);
  });

  it('counts new cards already introduced today against the limit', () => {
    const queue = queueOf({
      cards: [card('a'), card('b')],
      reviewsToday: [review('earlier', { first: true })],
      limits: { newCardsPerDeck: 2, reviewsPerDeck: 200 },
    });

    expect(queue).toHaveLength(1);
  });

  it('applies the review limit per deck, not across decks', () => {
    const queue = queueOf({
      cards: [card('a1', { deckId: 'deck-a' }), card('b1', { deckId: 'deck-b' })],
      states: [
        { ...state('a1', memory('review', minutes(-10))), deckId: 'deck-a' },
        { ...state('b1', memory('review', minutes(-10))), deckId: 'deck-b' },
      ],
      reviewsToday: [review('a0', { deckId: 'deck-a' })],
      limits: { newCardsPerDeck: 20, reviewsPerDeck: 1 },
    });

    expect(queue.map((entry) => entry.cardId)).toEqual(['b1']);
  });

  it('never shows both sides of a reversible card on the same day', () => {
    const queue = queueOf({ cards: [card('both', { cardType: 'reversible' })] });

    expect(queue).toEqual([{ cardId: 'both', bucket: 'new', direction: 'forward' }]);
  });

  it('skips the sibling side once one side was reviewed today', () => {
    const queue = queueOf({
      cards: [card('both', { cardType: 'reversible' })],
      states: [
        state('both', memory('review', minutes(60 * 24 * 3)), 'forward'),
        state('both', memory('review', minutes(-5)), 'reverse'),
      ],
      reviewsToday: [review('both', { direction: 'forward', first: true })],
    });

    expect(queue).toEqual([]);
  });

  it('leaves suspended cards out', () => {
    const queue = queueOf({
      cards: [card('paused')],
      states: [{ ...state('paused', memory('review', minutes(-5))), suspended: true }],
    });

    expect(queue).toEqual([]);
  });
});
