import { AddCardsToolInputSchema, type DeckCard, IdempotencyKeySchema } from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import {
  addBackArguments,
  addBackKey,
  type CardsDeletedView,
  readAddedBack,
  renderCardsDeleted,
} from './cards-deleted-markup.js';

const DECK_ID = '00000000-0000-4000-8000-000000000001';
const id = (index: number): string => `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
const card = (index: number, overrides: Partial<DeckCard> = {}): DeckCard => ({
  id: id(index),
  type: 'basic',
  front: `front ${index}`,
  back: `back ${index}`,
  extra: '',
  tags: [],
  addedBy: null,
  ...overrides,
});
const view = (overrides: Partial<CardsDeletedView> = {}): CardsDeletedView => ({
  deck: {
    id: DECK_ID,
    title: 'Spanish verbs',
    url: `https://deck.club/decks/${DECK_ID}`,
    cardCount: 40,
  },
  deleted: [card(1), card(2)],
  notFound: [],
  notDeleted: [],
  ...overrides,
});

describe('renderCardsDeleted', () => {
  it('says how many cards were deleted, on the deck’s pastel, with its new count', () => {
    const html = renderCardsDeleted(view());

    expect(html).toMatch(
      /<span class="highlight" style="--highlight: var\(--color-[a-z]+\)">2 cards deleted<\/span>/,
    );
    expect(html).toContain('From Spanish verbs · now 40 cards');
  });

  it('shows each deleted card on a slip, labelled for screen readers', () => {
    const html = renderCardsDeleted(view());

    expect(html).toContain('<ul class="deleted-list" aria-label="Deleted cards">');
    expect(html.match(/<li class="deleted-card">/g)).toHaveLength(2);
    expect(html).toContain(
      '<span class="visually-hidden">Deleted card. Front: </span><p class="deleted-front">front 1</p>',
    );
    expect(html).toContain('<p class="deleted-back">back 2</p>');
  });

  it('offers to add the cards back as new cards, saying their progress starts over', () => {
    const html = renderCardsDeleted(view());

    expect(html).toContain('<h2 id="cards-deleted-next-title">Changed your mind?</h2>');
    expect(html).toContain('Deleted cards cannot be restored yet.');
    expect(html).toContain('their study progress starts over');
    expect(html).toContain(
      `<button class="button" type="button" data-action="add-back" data-value="${DECK_ID}">Add them back as new cards</button>`,
    );
    expect(html).toContain(`data-action="open" data-value="https://deck.club/decks/${DECK_ID}"`);
  });

  it('says the cards are back once they were added back, with nothing more to add', () => {
    const html = renderCardsDeleted(view({ addedBack: 2 }));

    expect(html).toContain('<h2 id="cards-deleted-next-title">Added back</h2>');
    expect(html).toContain('2 cards are back in the deck as new cards');
    expect(html).not.toContain('data-action="add-back"');
  });

  it('says which cards were not in the deck', () => {
    expect(renderCardsDeleted(view({ notFound: [id(8), id(9)] }))).toContain(
      '2 other cards were not in this deck: already deleted, or never there.',
    );
    expect(renderCardsDeleted(view({ notFound: [id(8)] }))).toContain(
      '1 other card was not in this deck',
    );
  });

  it('says when Deck Club stopped part-way, and offers to ask the assistant to try again', () => {
    const html = renderCardsDeleted(view({ notDeleted: [id(3)] }));

    expect(html).toContain('1 card was not deleted: Deck Club stopped part-way.');
    expect(html).toContain(
      'data-action="ask" data-value="Try again to delete the card you could not delete from my &quot;Spanish verbs&quot; deck."',
    );
  });

  it('says nothing was deleted when none of the cards was in the deck', () => {
    const html = renderCardsDeleted(
      view({ deleted: [], notFound: [id(1)], deck: { ...view().deck, cardCount: 42 } }),
    );

    expect(html).toContain('>Nothing deleted</span>');
    expect(html).toContain(
      'None of these cards is in Spanish verbs: already deleted, or never there.',
    );
    expect(html).not.toContain('data-action="add-back"');
    expect(html).not.toContain('deleted-list');
  });

  it('escapes the deck’s and the cards’ text', () => {
    const html = renderCardsDeleted(
      view({
        deck: { ...view().deck, title: '<img src=x onerror=alert(1)>' },
        deleted: [card(1, { front: '<script>alert(1)</script>', back: '</p><b>x</b>' })],
      }),
    );

    expect(html).not.toContain('<img');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<b>x</b>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
});

describe('addBackArguments', () => {
  it('adds the deleted cards back to their deck with their content as it was', () => {
    const deleted = [card(1, { type: 'reversible', extra: 'yo hablo', tags: ['verbs'] }), card(2)];

    expect(addBackArguments(view({ deleted }))).toEqual({
      deckId: DECK_ID,
      cards: [
        {
          type: 'reversible',
          front: 'front 1',
          back: 'back 1',
          extra: 'yo hablo',
          tags: ['verbs'],
        },
        { type: 'basic', front: 'front 2', back: 'back 2', extra: '', tags: [] },
      ],
      idempotencyKey: addBackKey(view({ deleted })),
    });
  });

  it('is a valid add_cards call', () => {
    expect(AddCardsToolInputSchema.safeParse(addBackArguments(view())).success).toBe(true);
  });
});

describe('addBackKey', () => {
  it('is a valid idempotency key', () => {
    expect(IdempotencyKeySchema.safeParse(addBackKey(view())).success).toBe(true);
  });

  it('is the same for the same deleted cards, in any order, so a second click adds nothing', () => {
    expect(addBackKey(view({ deleted: [card(2), card(1)] }))).toBe(addBackKey(view()));
  });

  it('differs for other deleted cards', () => {
    expect(addBackKey(view({ deleted: [card(1), card(3)] }))).not.toBe(addBackKey(view()));
    expect(addBackKey(view({ deleted: [card(1)] }))).not.toBe(addBackKey(view()));
  });
});

describe('readAddedBack', () => {
  const added = {
    deck: {
      id: DECK_ID,
      title: 'Spanish verbs',
      description: '',
      language: 'es',
      cardCount: 42,
      url: `https://deck.club/decks/${DECK_ID}`,
    },
    cards: [card(5)],
    firstCardNumber: 42,
    nextCursor: null,
    addedCount: 1,
  };

  it('reads the cards the view added back', () => {
    expect(readAddedBack({ structuredContent: added })?.addedCount).toBe(1);
  });

  it('gives up on a refusal or a result that breaks the contract', () => {
    expect(readAddedBack({ isError: true, structuredContent: added })).toBeNull();
    expect(readAddedBack({ structuredContent: { addedCount: 'one' } })).toBeNull();
  });
});
