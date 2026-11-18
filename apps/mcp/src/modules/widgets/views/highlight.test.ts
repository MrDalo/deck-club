import { describe, expect, it } from 'vitest';
import { highlight, highlightTermsOf } from './highlight.js';

describe('highlightTermsOf', () => {
  it('folds the search into distinct words', () => {
    expect(highlightTermsOf('  Café  CAFÉ crème ')).toEqual(['cafe', 'creme']);
  });

  it('has no words for a blank search', () => {
    expect(highlightTermsOf('   ')).toEqual([]);
  });
});

describe('highlight', () => {
  it('marks a word whatever its case and accents, keeping the text as written', () => {
    expect(highlight('Un Café, por favor', highlightTermsOf('cafe'))).toBe(
      'Un <mark>Café</mark>, por favor',
    );
  });

  it('marks every occurrence of every word', () => {
    expect(highlight('hablar y hablo', highlightTermsOf('habl y'))).toBe(
      '<mark>habl</mark>ar <mark>y</mark> <mark>habl</mark>o',
    );
  });

  it('joins overlapping words into one mark', () => {
    expect(highlight('photosynthesis', highlightTermsOf('photo tosyn'))).toBe(
      '<mark>photosyn</mark>thesis',
    );
  });

  it('escapes text inside and outside the marks', () => {
    expect(highlight('<b>cafe</b> & co', highlightTermsOf('cafe'))).toBe(
      '&lt;b&gt;<mark>cafe</mark>&lt;/b&gt; &amp; co',
    );
  });

  it('cannot be tricked into marking markup the search spells', () => {
    expect(highlight('<script>', highlightTermsOf('script'))).toBe('&lt;<mark>script</mark>&gt;');
  });

  it('leaves text without the words unmarked, only escaped', () => {
    expect(highlight('to speak "well"', [])).toBe('to speak &quot;well&quot;');
  });

  it('keeps characters outside the basic plane whole', () => {
    expect(highlight('🎉 party', highlightTermsOf('party'))).toBe('🎉 <mark>party</mark>');
  });

  it('maps a character that folds into two back to the one written', () => {
    expect(highlight('ﬁsh', highlightTermsOf('fish'))).toBe('<mark>ﬁsh</mark>');
  });
});
