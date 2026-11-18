import { describe, expect, it } from 'vitest';
import { type Card, createCard } from './card.js';
import { compareMatches, matchCard, normalizeSearchText, parseSearchQuery } from './card-search.js';

let sequence = 0;
function card(content: Partial<Pick<Card, 'front' | 'back' | 'extra' | 'tags'>>, minute = 0): Card {
  sequence += 1;
  return createCard({
    id: `00000000-0000-4000-8000-${String(sequence).padStart(12, '0')}`,
    deckId: '00000000-0000-4000-8000-00000000d001',
    command: { type: 'basic', front: 'front', back: 'back', extra: '', tags: [], ...content },
    provenance: { source: 'app', clientName: null },
    now: new Date(Date.UTC(2026, 10, 17, 10, minute)),
  });
}
const match = (content: Parameters<typeof card>[0], search: string) =>
  matchCard(card(content), parseSearchQuery(search));

describe('normalizeSearchText', () => {
  it('ignores case, accents and extra whitespace', () => {
    expect(normalizeSearchText('  Café   CRÈME\tbrûlée ')).toBe('cafe creme brulee');
  });

  it('keeps non-Latin scripts', () => {
    expect(normalizeSearchText('Привет Мир')).toBe('привет мир');
  });
});

describe('parseSearchQuery', () => {
  it('splits the search into distinct words', () => {
    expect(parseSearchQuery('Hablar  hablar presente')).toEqual({
      phrase: 'hablar hablar presente',
      terms: ['hablar', 'presente'],
    });
  });

  it('uses at most ten words', () => {
    const words = Array.from({ length: 12 }, (_, index) => `w${index}`).join(' ');

    expect(parseSearchQuery(words).terms).toHaveLength(10);
  });
});

describe('matchCard', () => {
  it('finds a word whatever its case and accents', () => {
    expect(match({ front: 'El café' }, 'CAFE')).not.toBeNull();
    expect(match({ front: 'cafe' }, 'café')).not.toBeNull();
  });

  it('needs every word of the search somewhere on the card', () => {
    expect(match({ front: 'hablar', back: 'to speak' }, 'hablar speak')).toMatchObject({
      matchedIn: ['front', 'back'],
    });
    expect(match({ front: 'hablar', back: 'to speak' }, 'hablar comer')).toBeNull();
  });

  it('looks in the extra text and the tags', () => {
    expect(match({ extra: 'yo hablo' }, 'hablo')?.matchedIn).toEqual(['extra']);
    expect(match({ tags: ['irregular'] }, 'irregular')?.matchedIn).toEqual(['tags']);
  });

  it('matches part of a word, as people type', () => {
    expect(match({ front: 'photosynthesis' }, 'synth')).not.toBeNull();
  });

  it('never matches an empty search', () => {
    expect(match({ front: 'anything' }, '   ')).toBeNull();
  });

  it('scores a word on the front above the same word on the back', () => {
    const onFront = match({ front: 'mitosis phase', back: 'x' }, 'mitosis');
    const onBack = match({ front: 'cell division', back: 'mitosis' }, 'mitosis');

    expect(onFront!.score).toBeGreaterThan(onBack!.score);
  });

  it('scores the search found as written above its words found apart', () => {
    const together = match({ front: 'the cell wall' }, 'cell wall');
    const apart = match({ front: 'the wall of a cell' }, 'cell wall');

    expect(together!.score).toBeGreaterThan(apart!.score);
  });

  it('puts a card whose front is the search first, the likely duplicate', () => {
    const duplicate = match({ front: 'Hablar' }, 'hablar');
    const mention = match({ front: 'hablar con alguien', back: 'hablar' }, 'hablar');

    expect(duplicate!.score).toBeGreaterThan(mention!.score);
  });
});

describe('compareMatches', () => {
  it('orders best first, then oldest first on a tie', () => {
    const query = parseSearchQuery('verb');
    const older = matchCard(card({ back: 'verb' }, 1), query)!;
    const newer = matchCard(card({ back: 'verb' }, 2), query)!;
    const best = matchCard(card({ front: 'verb' }, 3), query)!;

    expect([newer, older, best].sort(compareMatches)).toEqual([best, older, newer]);
  });
});
