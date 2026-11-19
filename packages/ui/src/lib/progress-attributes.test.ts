import { describe, expect, it } from 'vitest';
import { progressAttributes } from './progress-attributes';

describe('progressAttributes', () => {
  it('announces a known value as a percentage', () => {
    expect(progressAttributes(30)).toMatchObject({
      'aria-valuenow': 30,
      'aria-valuetext': '30%',
      'data-state': 'loading',
    });
  });

  it('is complete at the maximum', () => {
    expect(progressAttributes(4, 4)).toMatchObject({
      'aria-valuenow': 4,
      'aria-valuetext': '100%',
      'data-state': 'complete',
    });
  });

  it('is indeterminate without a value and announces no number', () => {
    const attributes = progressAttributes(null);
    expect(attributes['data-state']).toBe('indeterminate');
    expect(attributes).not.toHaveProperty('aria-valuenow');
  });
});
