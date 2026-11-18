import type { AddCardsOutput, DeckCard } from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import { renderCardsAdded } from './cards-added-markup.js';
import { appendPage } from './deck-markup.js';

const DECK_ID = '00000000-0000-4000-8000-000000000001';
const card = (index: number, overrides: Partial<DeckCard> = {}): DeckCard => ({
  id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
  type: 'basic',
  front: `front ${index}`,
  back: `back ${index}`,
  extra: '',
  tags: [],
  addedBy: 'Claude',
  ...overrides,
});
const output = (overrides: Partial<AddCardsOutput> = {}): AddCardsOutput => ({
  deck: {
    id: DECK_ID,
    title: 'Spanish verbs',
    description: 'A1 vocabulary',
    language: 'es',
    cardCount: 42,
    url: `https://deck.club/decks/${DECK_ID}`,
  },
  cards: [card(41), card(42)],
  firstCardNumber: 41,
  nextCursor: null,
  addedCount: 2,
  ...overrides,
});

describe('renderCardsAdded', () => {
  it('announces how many cards were added, on the deck’s own pastel', () => {
    const html = renderCardsAdded(output());

    expect(html).toMatch(
      /<span class="highlight" style="--highlight: var\(--color-[a-z]+\)">2 cards added<\/span>/,
    );
    expect(html).toContain('In Spanish verbs · ES · now 42 cards');
  });

  it('says "1 card added" for one', () => {
    expect(renderCardsAdded(output({ cards: [card(42)], addedCount: 1 }))).toContain(
      '>1 card added</span>',
    );
  });

  it('shows each new card as a ruled index card, numbered where it sits in the deck', () => {
    const html = renderCardsAdded(output());

    expect(html).toContain('<ol class="card-list" start="41">');
    expect(html.match(/<li class="card">/g)).toHaveLength(2);
    expect(html).toContain('<p class="card-front">front 41</p>');
    expect(html).toContain('<p class="card-back">back 42</p>');
  });

  it('marks each card with the assistant that wrote it, and shows its type and tags', () => {
    const html = renderCardsAdded(
      output({ cards: [card(42, { type: 'reversible', tags: ['verbs'] })], addedCount: 1 }),
    );

    expect(html).toContain('<span class="chip chip-mint">Added by Claude</span>');
    expect(html).toContain('<span class="chip chip-sky">Reversible</span>');
    expect(html).toContain('aria-label="Tag: verbs">verbs</span>');
  });

  it('says how many of a large batch are on screen, and offers the rest', () => {
    const cards = Array.from({ length: 25 }, (_, index) => card(index + 3));
    const html = renderCardsAdded(
      output({ cards, firstCardNumber: 3, addedCount: 40, nextCursor: 'cursor-28' }),
    );

    expect(html).toContain('Showing 25 of the 40 new cards');
    expect(html).toContain('data-action="more" data-value="cursor-28"');
  });

  it('does not offer more cards, or a count, when every new card is on screen', () => {
    const html = renderCardsAdded(output());

    expect(html).not.toContain('data-action="more"');
    expect(html).not.toContain('page-status');
  });

  it('makes studying the main next step, and offers more cards and the deck', () => {
    const html = renderCardsAdded(output());

    expect(html).toContain('<section class="panel" aria-labelledby="cards-added-next-title">');
    expect(html).toContain(
      '<button class="button" type="button" data-action="ask" data-value="Quiz me on my &quot;Spanish verbs&quot; deck.">Quiz me on this deck</button>',
    );
    expect(html).toContain(
      'data-action="ask" data-value="Add 10 new cards to my &quot;Spanish verbs&quot; deck."',
    );
    expect(html).toContain(`data-action="open" data-value="https://deck.club/decks/${DECK_ID}"`);
    expect(html).toContain('aria-label="Open Spanish verbs in Deck Club"');
    expect(html).toContain('Ask the assistant to fix or remove a card.');
  });

  it('escapes the deck’s and the cards’ text, so nothing can inject markup into the chat', () => {
    const html = renderCardsAdded(
      output({
        deck: { ...output().deck, title: '<img src=x onerror=alert(1)>' },
        cards: [card(42, { front: '<script>alert(1)</script>', back: '" onclick="x' })],
        addedCount: 1,
      }),
    );

    expect(html).not.toContain('<img');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
});

describe('appendPage on an add_cards result', () => {
  it('keeps how many cards were added while it appends the next page', () => {
    const shown = output({ cards: [card(41)], addedCount: 2, nextCursor: 'cursor-42' });
    const next = {
      deck: output().deck,
      cards: [card(42)],
      firstCardNumber: 42,
      nextCursor: null,
    };

    expect(appendPage(shown, next)).toEqual({
      ...shown,
      cards: [card(41), card(42)],
      nextCursor: null,
    });
  });
});
