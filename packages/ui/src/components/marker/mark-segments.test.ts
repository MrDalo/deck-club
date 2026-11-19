import { describe, expect, it } from 'vitest';
import { markSegments, markTermsOf } from './mark-segments';

const render = (text: string, query: string): string =>
  markSegments(text, markTermsOf(query))
    .map((segment) => (segment.marked ? `[${segment.text}]` : segment.text))
    .join('');

describe('markTermsOf', () => {
  it('folds the search into distinct words', () => {
    expect(markTermsOf('  Café  CAFÉ crème ')).toEqual(['cafe', 'creme']);
  });

  it('has no words for a blank search', () => {
    expect(markTermsOf('   ')).toEqual([]);
  });
});

describe('markSegments', () => {
  it('marks a word whatever its case and accents, keeping the text as written', () => {
    expect(render('Un Café, por favor', 'cafe')).toBe('Un [Café], por favor');
  });

  it('marks every occurrence of every word', () => {
    expect(render('hablar y hablo', 'habl y')).toBe('[habl]ar [y] [habl]o');
  });

  it('joins overlapping words into one run', () => {
    expect(render('photosynthesis', 'photo tosyn')).toBe('[photosyn]thesis');
  });

  it('marks Slovak and Czech text with or without diacritics', () => {
    expect(render('Mitóza a meióza', 'mitoza')).toBe('[Mitóza] a meióza');
    expect(render('Buněčné dělení', 'DĚLENÍ')).toBe('Buněčné [dělení]');
  });

  it('returns the text as one unmarked run without words', () => {
    expect(markSegments('Mitosis', [])).toEqual([{ text: 'Mitosis', marked: false }]);
  });

  it('returns nothing for empty text', () => {
    expect(markSegments('', ['cell'])).toEqual([]);
  });
});
