import type { Rating, StudyDirection } from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import type { Review } from './study-state.js';
import { forgottenSides } from './weak-cards.js';

const SINCE = new Date('2026-10-18T10:00:00Z');
let counter = 0;

function review(
  cardId: string,
  rating: Rating,
  at: string,
  direction: StudyDirection = 'forward',
): Review {
  counter += 1;
  return {
    id: `r${counter}`,
    userId: 'ana',
    deckId: 'deck',
    cardId,
    direction,
    rating,
    source: 'app',
    clientName: null,
    durationMs: null,
    reviewedAt: new Date(at),
    previousMemory: null,
    undoneAt: null,
  };
}

describe('forgottenSides', () => {
  it('finds a side forgotten twice in the window, with when it was last forgotten', () => {
    const sides = forgottenSides(
      [
        review('hablar', 'again', '2026-11-10T10:00:00Z'),
        review('hablar', 'good', '2026-11-11T10:00:00Z'),
        review('hablar', 'again', '2026-11-15T10:00:00Z'),
      ],
      SINCE,
    );

    expect(sides).toEqual([
      {
        deckId: 'deck',
        cardId: 'hablar',
        direction: 'forward',
        forgotten: 2,
        lastForgottenAt: new Date('2026-11-15T10:00:00Z'),
      },
    ]);
  });

  it('leaves out a side forgotten once: one slip is not a weak spot', () => {
    expect(forgottenSides([review('comer', 'again', '2026-11-10T10:00:00Z')], SINCE)).toEqual([]);
  });

  it('counts only Again, and only inside the window', () => {
    const sides = forgottenSides(
      [
        review('vivir', 'again', '2026-10-01T10:00:00Z'),
        review('vivir', 'again', '2026-11-01T10:00:00Z'),
        review('vivir', 'hard', '2026-11-02T10:00:00Z'),
      ],
      SINCE,
    );

    expect(sides).toEqual([]);
  });

  it('keeps the two sides of a reversible card apart', () => {
    const sides = forgottenSides(
      [
        review('ser', 'again', '2026-11-01T10:00:00Z', 'forward'),
        review('ser', 'again', '2026-11-02T10:00:00Z', 'reverse'),
        review('ser', 'again', '2026-11-03T10:00:00Z', 'reverse'),
      ],
      SINCE,
    );

    expect(sides.map((side) => [side.cardId, side.direction, side.forgotten])).toEqual([
      ['ser', 'reverse', 2],
    ]);
  });

  it('puts the most forgotten first, then the most recently forgotten', () => {
    const sides = forgottenSides(
      [
        review('a', 'again', '2026-11-01T10:00:00Z'),
        review('a', 'again', '2026-11-02T10:00:00Z'),
        review('b', 'again', '2026-11-01T10:00:00Z'),
        review('b', 'again', '2026-11-02T10:00:00Z'),
        review('b', 'again', '2026-11-03T10:00:00Z'),
        review('c', 'again', '2026-11-05T10:00:00Z'),
        review('c', 'again', '2026-11-06T10:00:00Z'),
      ],
      SINCE,
    );

    expect(sides.map((side) => side.cardId)).toEqual(['b', 'c', 'a']);
  });
});
