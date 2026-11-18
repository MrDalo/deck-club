import type { DeckCard } from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import { indexCard } from './card-components.js';
import { highlightTermsOf } from './highlight.js';

const CARD: DeckCard = {
  id: '00000000-0000-4000-8000-000000000001',
  type: 'basic',
  front: 'hablar',
  back: 'to speak',
  extra: '',
  tags: [],
  addedBy: null,
};

describe('indexCard', () => {
  it('shows the two sides as ruled index cards, without marks or chips by default', () => {
    const html = indexCard(CARD);

    expect(html).toContain('<p class="card-front">hablar</p>');
    expect(html).toContain('<p class="card-back">to speak</p>');
    expect(html.match(/class="ruled card-side"/g)).toHaveLength(2);
    expect(html).not.toContain('<mark>');
    expect(html).not.toContain('card-meta');
    expect(html).not.toContain('card-actions');
  });

  it('marks search words on the front, back and extra', () => {
    const html = indexCard({ ...CARD, extra: 'yo hablo' }, { terms: highlightTermsOf('habl') });

    expect(html).toContain('<mark>habl</mark>ar');
    expect(html).toContain('yo <mark>habl</mark>o');
  });

  it('puts leading chips first and buttons under the card', () => {
    const html = indexCard(
      { ...CARD, addedBy: 'Claude' },
      { leadingChips: ['<span class="chip">Deck</span>'], actions: '<button>Open</button>' },
    );

    expect(html).toMatch(
      /<p class="card-meta"><span class="chip">Deck<\/span><span class="chip chip-mint">/,
    );
    expect(html).toContain('<div class="actions card-actions"><button>Open</button></div>');
  });
});
