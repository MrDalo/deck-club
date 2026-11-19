import { describe, expect, it } from 'vitest';
import { PASTELS } from './brand';
import { pastelFor } from './pastel';

describe('pastelFor', () => {
  it('gives the same seed the same pastel', () => {
    expect(pastelFor('Jana Nováková')).toBe(pastelFor('Jana Nováková'));
  });

  it('always answers one of the six pastels', () => {
    for (const seed of ['', 'a', 'Deck Club', '🃏', 'x'.repeat(500)])
      expect(PASTELS).toContain(pastelFor(seed));
  });

  it('spreads different seeds over the palette', () => {
    const used = new Set(Array.from({ length: 60 }, (_, index) => pastelFor(`deck-${index}`)));
    expect(used.size).toBe(PASTELS.length);
  });
});
