import { describe, expect, it } from 'vitest';
import { HIT_DECK_ID, testHit, testSearchResult } from '../testing/search-hits.js';
import { formatSearchResults, toSearchResults } from './card-search-view.js';

const WEB_URL = 'https://deck.club';
const ALL_DECKS = { query: 'hablar', limit: 20 };

describe('toSearchResults', () => {
  it('keeps each card with its deck, the deck’s link and where it matched', () => {
    const output = toSearchResults(
      testSearchResult([testHit(1, { matchedIn: ['front', 'tags'] })]),
      ALL_DECKS,
      WEB_URL,
    );

    expect(output).toEqual({
      query: 'hablar',
      deckId: null,
      matches: [
        {
          card: {
            id: '00000000-0000-4000-8000-000000000001',
            type: 'basic',
            front: 'hablar 1',
            back: 'to speak',
            extra: '',
            tags: [],
            addedBy: null,
          },
          deck: {
            id: HIT_DECK_ID,
            title: 'Spanish verbs',
            url: `https://deck.club/decks/${HIT_DECK_ID}`,
          },
          matchedIn: ['front', 'tags'],
        },
      ],
      totalMatches: 1,
    });
  });

  it('echoes the deck the search was limited to', () => {
    expect(
      toSearchResults(testSearchResult([]), { ...ALL_DECKS, deckId: HIT_DECK_ID }, WEB_URL).deckId,
    ).toBe(HIT_DECK_ID);
  });
});

describe('formatSearchResults', () => {
  it('lists each match with its deck, the ids to act on and where it matched', () => {
    const text = formatSearchResults(
      toSearchResults(testSearchResult([testHit(1), testHit(2)]), ALL_DECKS, WEB_URL),
    );

    expect(text.split('\n')).toEqual([
      '2 cards match "hablar" across all decks:',
      `1. in "Spanish verbs" (deck id: ${HIT_DECK_ID}, card id: 00000000-0000-4000-8000-000000000001) [basic] front: hablar 1 | back: to speak | matched in: front`,
      `2. in "Spanish verbs" (deck id: ${HIT_DECK_ID}, card id: 00000000-0000-4000-8000-000000000002) [basic] front: hablar 2 | back: to speak | matched in: front`,
    ]);
  });

  it('says "1 card matches" and names the scope of a deck search', () => {
    const text = formatSearchResults(
      toSearchResults(
        testSearchResult([testHit(1)]),
        { ...ALL_DECKS, deckId: HIT_DECK_ID },
        WEB_URL,
      ),
    );

    expect(text).toContain('1 card matches "hablar" in the chosen deck:');
  });

  it('tells the AI when there are more matches than it was shown', () => {
    const text = formatSearchResults(
      toSearchResults(testSearchResult([testHit(1)], 35), ALL_DECKS, WEB_URL),
    );

    expect(text).toContain('35 cards match');
    expect(text).toContain(
      'Showing the 1 best. Narrow the search, or raise limit (up to 50) to see more.',
    );
  });

  it('gives a plain verdict when nothing matches, so the AI knows it may add the card', () => {
    expect(formatSearchResults(toSearchResults(testSearchResult([]), ALL_DECKS, WEB_URL))).toBe(
      'No cards match "hablar" across all decks. The user has no card about it yet, so it is safe to add one.',
    );
  });
});
