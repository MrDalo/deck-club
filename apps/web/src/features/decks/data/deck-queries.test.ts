import { afterEach, describe, expect, it, vi } from 'vitest';
import { cardListQuery, deckListQuery, deckQuery } from './deck-queries';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('deck queries', () => {
  it('nest card keys under their deck so invalidating a deck refreshes its cards', () => {
    const deckId = '00000000-0000-4000-8000-000000000001';

    expect(cardListQuery(deckId).queryKey.slice(0, 2)).toEqual(deckQuery(deckId).queryKey);
    expect(deckQuery(deckId).queryKey[0]).toBe(deckListQuery().queryKey[0]);
  });

  it('unwraps the deck list from the API envelope', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(Response.json({ decks: [] }))),
    );
    const { queryFn } = deckListQuery();

    await expect((queryFn as () => Promise<unknown>)()).resolves.toEqual([]);
  });
});
