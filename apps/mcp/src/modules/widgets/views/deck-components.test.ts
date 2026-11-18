import type { DeckSummary } from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import { deckTile } from './deck-components.js';

const DECK: DeckSummary = {
  id: '00000000-0000-4000-8000-000000000001',
  title: 'Spanish verbs',
  description: '',
  language: 'es',
  cardCount: 1,
  url: 'https://deck.club/decks/00000000-0000-4000-8000-000000000001',
};

describe('deckTile', () => {
  it('is an index card with the deck’s tab, title, language and card count', () => {
    const html = deckTile(DECK, { actions: '<button>Open</button>' });

    expect(html).toMatch(/<article class="deck" style="--deck-accent: var\(--color-[a-z]+\)">/);
    expect(html).toContain('<span class="deck-tab" aria-hidden="true"></span>');
    expect(html).toContain('<h2>Spanish verbs</h2>');
    expect(html).toContain('aria-label="Language: es"');
    expect(html).toContain('<span>1 card</span>');
    expect(html).toContain('<button>Open</button>');
  });

  it('adds extra chips after the count', () => {
    expect(
      deckTile(DECK, { actions: '', extraChips: ['<span class="chip">Private</span>'] }),
    ).toMatch(/1 card<\/span>\s*<span class="chip">Private<\/span>/);
  });

  it('leaves out an empty description', () => {
    expect(deckTile(DECK, { actions: '' })).not.toContain('deck-description');
  });
});
