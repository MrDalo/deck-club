import { describe, expect, it } from 'vitest';
import { countLabel } from './count-label.js';

describe('countLabel', () => {
  it('uses the singular for one and the plural otherwise', () => {
    expect([countLabel(1, 'card'), countLabel(0, 'card'), countLabel(42, 'card')]).toEqual([
      '1 card',
      '0 cards',
      '42 cards',
    ]);
  });

  it('takes an irregular plural', () => {
    expect(countLabel(2, 'query', 'queries')).toBe('2 queries');
  });
});
