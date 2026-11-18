import type { ListDecksOutput } from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import { ASK_TO_CREATE_DECK } from './chat-messages.js';
import { renderDeckLibrary } from './deck-library-markup.js';

const SPANISH = {
  id: '00000000-0000-4000-8000-000000000001',
  title: 'Spanish verbs',
  description: 'A1 vocabulary',
  language: 'es',
  cardCount: 42,
  url: 'https://deck.club/decks/00000000-0000-4000-8000-000000000001',
};
const library = (decks: ListDecksOutput['decks']): ListDecksOutput => ({
  decks,
  deckCount: decks.length,
  libraryUrl: 'https://deck.club/decks',
});

describe('renderDeckLibrary', () => {
  it('shows each deck as an index card with its counts and language', () => {
    const html = renderDeckLibrary(library([SPANISH]));

    expect(html).toContain('<h2>Spanish verbs</h2>');
    expect(html).toContain('A1 vocabulary');
    expect(html).toContain('42 cards');
    expect(html).toContain('aria-label="Language: es"');
  });

  it('sums the library in the heading', () => {
    const html = renderDeckLibrary(library([SPANISH, { ...SPANISH, id: 'x', cardCount: 1 }]));

    expect(html).toContain('<h1><span class="highlight">Your decks</span></h1>');
    expect(html).toContain('2 decks · 43 cards');
  });

  it('writes singulars for one deck and one card', () => {
    expect(renderDeckLibrary(library([{ ...SPANISH, cardCount: 1 }]))).toContain('1 deck · 1 card');
  });

  it('gives each deck its stable pastel tab', () => {
    expect(renderDeckLibrary(library([SPANISH]))).toContain('--deck-accent: var(--color-');
  });

  it('offers to open the deck and to ask for more cards, named for screen readers', () => {
    const html = renderDeckLibrary(library([SPANISH]));

    expect(html).toContain(`data-action="open" data-value="${SPANISH.url}"`);
    expect(html).toContain(
      'data-action="ask" data-value="Add 10 new cards to my &quot;Spanish verbs&quot; deck."',
    );
    expect(html).toContain('aria-label="Open Spanish verbs in Deck Club"');
    expect(html).toContain('data-value="https://deck.club/decks"');
  });

  it('invites the user to start when the library is empty', () => {
    const html = renderDeckLibrary(library([]));

    expect(html).toContain('No decks yet');
    expect(html).toContain('Nothing here yet.');
    expect(html).toContain(`data-value="${ASK_TO_CREATE_DECK}"`);
    expect(html).not.toContain('<ul');
  });

  it('leaves out the description of a deck that has none', () => {
    expect(renderDeckLibrary(library([{ ...SPANISH, description: '' }]))).not.toContain(
      'deck-description',
    );
  });

  it('escapes deck text, so a title can never inject markup', () => {
    const html = renderDeckLibrary(
      library([
        { ...SPANISH, title: '<script>alert(1)</script>', description: '" onmouseover="x' },
      ]),
    );

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('" onmouseover="x');
  });
});
