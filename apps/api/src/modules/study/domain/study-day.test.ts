import { describe, expect, it } from 'vitest';
import { streakDays, studyDayOf } from './study-day.js';

const at = (iso: string): Date => new Date(iso);

describe('studyDayOf', () => {
  it('starts the day at the configured hour, not midnight', () => {
    const day = studyDayOf(at('2026-11-17T10:00:00Z'), 4);

    expect(day).toEqual({
      start: at('2026-11-17T04:00:00Z'),
      end: at('2026-11-18T04:00:00Z'),
      key: '2026-11-17',
    });
  });

  it('counts late-night study (before the day start) for the previous day', () => {
    expect(studyDayOf(at('2026-11-18T02:30:00Z'), 4).key).toBe('2026-11-17');
  });

  it('puts the exact start instant in the new day', () => {
    expect(studyDayOf(at('2026-11-18T04:00:00Z'), 4).key).toBe('2026-11-18');
  });
});

describe('streakDays', () => {
  const now = at('2026-11-17T12:00:00Z');

  it('counts consecutive days ending today', () => {
    const reviews = [
      at('2026-11-15T09:00:00Z'),
      at('2026-11-16T09:00:00Z'),
      at('2026-11-17T09:00:00Z'),
    ];

    expect(streakDays(reviews, now, 4)).toBe(3);
  });

  it('keeps yesterday’s streak alive when today has no review yet', () => {
    const reviews = [at('2026-11-15T09:00:00Z'), at('2026-11-16T09:00:00Z')];

    expect(streakDays(reviews, now, 4)).toBe(2);
  });

  it('breaks at a missed day', () => {
    const reviews = [
      at('2026-11-14T09:00:00Z'),
      at('2026-11-16T09:00:00Z'),
      at('2026-11-17T09:00:00Z'),
    ];

    expect(streakDays(reviews, now, 4)).toBe(2);
  });

  it('is zero without reviews', () => {
    expect(streakDays([], now, 4)).toBe(0);
  });
});
