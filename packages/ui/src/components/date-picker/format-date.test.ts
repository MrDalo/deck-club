import { describe, expect, it } from 'vitest';
import { formatDate, formatDateRange } from './format-date';

const EXAM = new Date(2026, 10, 18);

describe('formatDate', () => {
  it('writes a long date in the given language', () => {
    expect(formatDate(EXAM, 'en-US')).toBe('November 18, 2026');
    expect(formatDate(EXAM, 'sk')).toBe('18. novembra 2026');
  });

  it('takes other Intl options', () => {
    expect(formatDate(EXAM, 'en-US', { dateStyle: 'short' })).toBe('11/18/26');
  });
});

describe('formatDateRange', () => {
  it('shares what both ends share', () => {
    expect(formatDateRange({ from: new Date(2026, 10, 16), to: EXAM }, 'en-US')).toMatch(
      /^November 16\s–\s18, 2026$/,
    );
  });

  it('shows the start of an open range, and nothing before a start', () => {
    expect(formatDateRange({ from: EXAM }, 'en-US')).toBe('November 18, 2026');
    expect(formatDateRange({ from: undefined }, 'en-US')).toBeUndefined();
    expect(formatDateRange(null, 'en-US')).toBeUndefined();
  });
});
