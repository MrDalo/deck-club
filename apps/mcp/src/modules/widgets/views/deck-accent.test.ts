import { describe, expect, it } from 'vitest';
import { deckAccent } from './deck-accent.js';

describe('deckAccent', () => {
  it('gives the same deck the same colour every time', () => {
    const deckId = '00000000-0000-4000-8000-000000000001';

    expect(deckAccent(deckId)).toBe(deckAccent(deckId));
  });

  it('picks the same pastel as the web app does for a deck', () => {
    // apps/web/src/features/decks/lib/deck-accent.ts hashes the id the same
    // way over the same list, so a deck looks the same in both places.
    expect(deckAccent('deck-0')).toBe('var(--color-peach)');
    expect(deckAccent('deck-1')).toBe('var(--color-sky)');
  });

  it('spreads decks across more than one colour', () => {
    const colours = new Set(Array.from({ length: 12 }, (_, index) => deckAccent(`deck-${index}`)));

    expect(colours.size).toBeGreaterThan(1);
  });

  it('only ever returns a brand pastel', () => {
    expect(deckAccent('anything')).toMatch(/^var\(--color-[a-z]+\)$/);
  });
});
