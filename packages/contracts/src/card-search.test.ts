import { describe, expect, it } from 'vitest';
import {
  CARD_SEARCH_LIMITS,
  CardSearchQuerySchema,
  CardSearchResultSchema,
} from './card-search.js';

const DECK_ID = '00000000-0000-4000-8000-000000000001';
const CARD = {
  id: '00000000-0000-4000-8000-000000000002',
  deckId: DECK_ID,
  type: 'basic',
  front: 'hablar',
  back: 'to speak',
  extra: '',
  tags: [],
  provenance: { source: 'app', clientName: null },
  createdAt: '2026-11-17T10:00:00.000Z',
  updatedAt: '2026-11-17T10:00:00.000Z',
};

describe('CardSearchQuerySchema', () => {
  it('trims the words and reads the limit from a query string', () => {
    expect(CardSearchQuerySchema.parse({ q: '  hablar ', limit: '5' })).toEqual({
      q: 'hablar',
      limit: 5,
    });
  });

  it('defaults to the 20 best matches in every deck', () => {
    expect(CardSearchQuerySchema.parse({ q: 'x' })).toEqual({
      q: 'x',
      limit: CARD_SEARCH_LIMITS.results.default,
    });
  });

  it('rejects an empty search', () => {
    expect(CardSearchQuerySchema.safeParse({ q: '   ' }).success).toBe(false);
  });

  it('rejects a search longer than 200 characters', () => {
    expect(CardSearchQuerySchema.safeParse({ q: 'x'.repeat(201) }).success).toBe(false);
  });

  it('rejects more than 50 results and a deck id that is not a UUID', () => {
    expect(CardSearchQuerySchema.safeParse({ q: 'x', limit: '51' }).success).toBe(false);
    expect(CardSearchQuerySchema.safeParse({ q: 'x', deckId: 'spanish' }).success).toBe(false);
  });
});

describe('CardSearchResultSchema', () => {
  it('accepts hits with their deck title and matched fields', () => {
    const result = {
      hits: [{ card: CARD, deckTitle: 'Spanish', matchedIn: ['front'] }],
      totalMatches: 1,
    };

    expect(CardSearchResultSchema.parse(result)).toEqual(result);
  });

  it('rejects a field a search does not look in', () => {
    expect(
      CardSearchResultSchema.safeParse({
        hits: [{ card: CARD, deckTitle: 'Spanish', matchedIn: ['provenance'] }],
        totalMatches: 1,
      }).success,
    ).toBe(false);
  });
});
