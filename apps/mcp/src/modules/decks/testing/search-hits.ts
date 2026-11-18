import type { CardSearchHit, CardSearchResult } from '@deck-club/contracts';
import { testCard } from './fake-decks-api.js';

/** The deck every test hit belongs to. */
export const HIT_DECK_ID = '00000000-0000-4000-8000-0000000000d1';

/**
 * A search hit as the API returns it.
 * @param index - makes the card id unique
 * @param hit - what matters to the test
 * @returns the hit
 */
export function testHit(
  index: number,
  hit: { front?: string; deckTitle?: string; matchedIn?: CardSearchHit['matchedIn'] } = {},
): CardSearchHit {
  return {
    card: testCard({
      id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
      deckId: HIT_DECK_ID,
      front: hit.front ?? `hablar ${index}`,
      back: 'to speak',
    }),
    deckTitle: hit.deckTitle ?? 'Spanish verbs',
    matchedIn: hit.matchedIn ?? ['front'],
  };
}

/**
 * A search result with these hits.
 * @param hits - the hits returned
 * @param totalMatches - how many matched in all, the number of hits by default
 * @returns the result
 */
export function testSearchResult(
  hits: CardSearchHit[],
  totalMatches = hits.length,
): CardSearchResult {
  return { hits, totalMatches };
}
