import { describe, expect, it } from 'vitest';
import { deckAccent } from './deck-accent';

describe('deckAccent', () => {
  it('gives the same deck the same colour every time', () => {
    const deckId = '00000000-0000-4000-8000-000000000001';

    expect(deckAccent(deckId)).toBe(deckAccent(deckId));
  });

  it('spreads decks across more than one colour', () => {
    const accents = new Set(
      Array.from({ length: 12 }, (_, index) => deckAccent(`deck-${index}`).className),
    );

    expect(accents.size).toBeGreaterThan(1);
  });
});
