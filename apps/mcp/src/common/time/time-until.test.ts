import { describe, expect, it } from 'vitest';
import { timeUntil } from './time-until.js';

const NOW = '2026-11-17T10:00:00.000Z';
const after = (ms: number): string => new Date(Date.parse(NOW) + ms).toISOString();
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('timeUntil', () => {
  it.each([
    [0, 'under a minute'],
    [-5 * MINUTE, 'under a minute'],
    [20 * 1000, 'under a minute'],
    [MINUTE, '1 min'],
    [10 * MINUTE, '10 min'],
    [59 * MINUTE, '59 min'],
    [59.6 * MINUTE, '1 hour'],
    [5 * HOUR, '5 hours'],
    [23.6 * HOUR, '1 day'],
    [3 * DAY, '3 days'],
    [30 * DAY, '30 days'],
    [45 * DAY, '1 month'],
    [200 * DAY, '7 months'],
    [365 * DAY, '1 year'],
    [800 * DAY, '2 years'],
  ])('says %i ms from now as "%s"', (ms, label) => {
    expect(timeUntil(NOW, after(ms))).toBe(label);
  });
});
