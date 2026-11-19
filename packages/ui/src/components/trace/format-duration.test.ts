import { describe, expect, it } from 'vitest';
import { formatDuration } from './format-duration.js';

describe('formatDuration', () => {
  it.each([
    [0, '0 ms'],
    [820, '820 ms'],
    [999.6, '1 sec'],
    [1400, '1.4 sec'],
    [12_000, '12 sec'],
    [59_949, '59.9 sec'],
    [59_950, '1 min'],
    [125_000, '2 min, 5 sec'],
    [3_600_000, '60 min'],
  ])('formats %d ms as “%s”', (milliseconds, expected) => {
    expect(formatDuration(milliseconds, 'en')).toBe(expected);
  });

  it('uses the reader’s locale', () => {
    expect(formatDuration(1400, 'cs')).toBe('1,4 s');
    expect(formatDuration(125_000, 'cs')).toBe('2 min, 5 s');
  });

  it('treats negative and non-finite values as zero', () => {
    expect(formatDuration(-5, 'en')).toBe('0 ms');
    expect(formatDuration(Number.NaN, 'en')).toBe('0 ms');
  });
});
