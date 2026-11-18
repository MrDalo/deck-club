import type { DeckCard, GetDeckOutput } from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import { appendPage, readNextPage, renderDeck } from './deck-markup.js';

const DECK_ID = '00000000-0000-4000-8000-000000000001';
const card = (index: number, overrides: Partial<DeckCard> = {}): DeckCard => ({
  id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
  type: 'basic',
  front: `front ${index}`,
  back: `back ${index}`,
  extra: '',
  tags: [],
  addedBy: null,
  ...overrides,
});
const detail = (overrides: Partial<GetDeckOutput> = {}): GetDeckOutput => ({
  deck: {
    id: DECK_ID,
    title: 'Spanish verbs',
    description: 'A1 vocabulary',
    language: 'es',
    cardCount: 2,
    url: `https://deck.club/decks/${DECK_ID}`,
  },
  cards: [card(1), card(2)],
  firstCardNumber: 1,
  nextCursor: null,
  ...overrides,
});

describe('renderDeck', () => {
  it('puts the title on the deck’s own pastel highlighter, like its web page', () => {
    const html = renderDeck(detail());

    expect(html).toMatch(
      /<span class="highlight" style="--highlight: var\(--color-[a-z]+\)">Spanish verbs<\/span>/,
    );
    expect(html).toContain('A1 vocabulary · ES · 2 cards');
  });

  it('shows each card as a ruled index card with its front and back', () => {
    const html = renderDeck(detail());

    expect(html.match(/<li class="card">/g)).toHaveLength(2);
    expect(html).toContain('<p class="card-front">front 1</p>');
    expect(html).toContain('<p class="card-back">back 2</p>');
    expect(html).toContain('class="ruled card-side"');
  });

  it('numbers the list from the page’s first card', () => {
    expect(renderDeck(detail({ firstCardNumber: 26 }))).toContain(
      '<ol class="card-list" start="26">',
    );
  });

  it('shows extra text, and chips for reversible cards, tags and AI authors', () => {
    const html = renderDeck(
      detail({
        cards: [
          card(1, { type: 'reversible', extra: 'yo hablo', tags: ['verbs'], addedBy: 'Claude' }),
        ],
      }),
    );

    expect(html).toContain('<p class="card-extra">yo hablo</p>');
    expect(html).toContain('<span class="chip chip-sky">Reversible</span>');
    expect(html).toContain('<span class="chip chip-paper" aria-label="Tag: verbs">verbs</span>');
    expect(html).toContain('<span class="chip chip-mint">Added by Claude</span>');
  });

  it('shows no chip row for a plain card a person wrote', () => {
    expect(renderDeck(detail({ cards: [card(1)] }))).not.toContain('card-meta');
  });

  it('says which cards are on screen', () => {
    expect(
      renderDeck(detail({ cards: [card(1)], deck: { ...detail().deck, cardCount: 30 } })),
    ).toContain('Showing cards 1 of 30');
    expect(renderDeck(detail())).toContain('Showing cards 1–2 of 2');
  });

  it('offers the next page only when there is one', () => {
    expect(renderDeck(detail())).not.toContain('data-action="more"');
    expect(renderDeck(detail({ nextCursor: 'cursor-2' }))).toContain(
      'data-action="more" data-value="cursor-2"',
    );
  });

  it('offers a quiz in chat and the deck in Deck Club', () => {
    const html = renderDeck(detail());

    expect(html).toContain(
      'data-action="ask" data-value="Quiz me on my &quot;Spanish verbs&quot; deck."',
    );
    expect(html).toContain(`data-action="open" data-value="https://deck.club/decks/${DECK_ID}"`);
  });

  it('invites the user to add cards to an empty deck', () => {
    const html = renderDeck(detail({ cards: [], deck: { ...detail().deck, cardCount: 0 } }));

    expect(html).toContain('No cards yet');
    expect(html).toContain('Add 10 new cards to my &quot;Spanish verbs&quot; deck.');
    expect(html).not.toContain('<ol');
  });

  it('escapes card text, so a card can never inject markup into the chat', () => {
    const html = renderDeck(
      detail({ cards: [card(1, { front: '<img src=x onerror=alert(1)>', back: '</p><script>' })] }),
    );

    expect(html).not.toContain('<img');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });
});

describe('appendPage', () => {
  it('adds the next page below the cards on screen and takes its cursor', () => {
    const shown = detail({
      cards: [card(1)],
      nextCursor: 'cursor-2',
      deck: { ...detail().deck, cardCount: 2 },
    });
    const next = detail({ cards: [card(2)], firstCardNumber: 2, nextCursor: null });

    expect(appendPage(shown, next)).toEqual({
      deck: next.deck,
      cards: [card(1), card(2)],
      firstCardNumber: 1,
      nextCursor: null,
    });
  });
});

describe('readNextPage', () => {
  it('reads a page from a successful tool result', () => {
    expect(readNextPage({ structuredContent: detail() })).toEqual(detail());
  });

  it('gives up on a refusal', () => {
    expect(readNextPage({ isError: true, structuredContent: detail() })).toBeNull();
  });

  it('gives up on a result that breaks the contract', () => {
    expect(readNextPage({ structuredContent: { cards: 'nope' } })).toBeNull();
    expect(readNextPage({})).toBeNull();
  });
});
