import type { Card } from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import { testCard, testDeck } from '../testing/fake-decks-api.js';
import { formatDeletedCards, toDeletedCards } from './cards-deleted-view.js';

const WEB_URL = 'https://deck.club';
const DECK = testDeck({ id: '00000000-0000-4000-8000-000000000001', title: 'Spanish verbs' });
const id = (index: number): string => `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
const card = (index: number, overrides: Partial<Card> = {}): Card =>
  testCard({
    id: id(index),
    deckId: DECK.id,
    front: `front ${index}`,
    back: `back ${index}`,
    ...overrides,
  });
const NONE = { deleted: [], notFound: [], notDeleted: [] };

describe('toDeletedCards', () => {
  it('returns the deck with its new count and the deleted cards as they were', () => {
    const output = toDeletedCards(DECK, 42, { ...NONE, deleted: [card(1), card(2)] }, WEB_URL);

    expect(output).toEqual({
      deck: {
        id: DECK.id,
        title: 'Spanish verbs',
        url: `https://deck.club/decks/${DECK.id}`,
        cardCount: 40,
      },
      deleted: [
        expect.objectContaining({ id: id(1), front: 'front 1', back: 'back 1' }),
        expect.objectContaining({ id: id(2), front: 'front 2' }),
      ],
      notFound: [],
      notDeleted: [],
    });
  });

  it('keeps the ids that were not found or not deleted', () => {
    const output = toDeletedCards(
      DECK,
      3,
      { deleted: [card(1)], notFound: [id(8)], notDeleted: [id(2), id(3)] },
      WEB_URL,
    );

    expect([output.notFound, output.notDeleted, output.deck.cardCount]).toEqual([
      [id(8)],
      [id(2), id(3)],
      2,
    ]);
  });
});

describe('formatDeletedCards', () => {
  it('gives the AI every deleted card in full, how to get them back, and the link', () => {
    const text = formatDeletedCards(
      toDeletedCards(
        DECK,
        42,
        { ...NONE, deleted: [card(1, { type: 'reversible', extra: 'yo hablo', tags: ['verbs'] })] },
        WEB_URL,
      ),
    );

    expect(text).toBe(
      [
        `Deleted 1 card from the deck "Spanish verbs" (id: ${DECK.id}); it now has 41 cards.`,
        'The deleted cards, as they were:',
        `- ${id(1)}: [reversible] front: front 1 | back: back 1 | extra: yo hablo | tags: verbs`,
        'Deleted cards cannot be restored yet; if the user wants them back, add them again with add_cards (their study progress starts over).',
        `Share the link with the user: https://deck.club/decks/${DECK.id}`,
      ].join('\n'),
    );
  });

  it('names the ids not in the deck and those left alone, and says a retry is safe', () => {
    const text = formatDeletedCards(
      toDeletedCards(
        DECK,
        5,
        { deleted: [card(1)], notFound: [id(8), id(9)], notDeleted: [id(2)] },
        WEB_URL,
      ),
    );

    expect(text).toContain(
      `Not in this deck (already deleted, or never there): ${id(8)}, ${id(9)}`,
    );
    expect(text).toContain(
      `Not deleted, because Deck Club stopped part-way: ${id(2)}. Calling delete_cards again with these ids is safe.`,
    );
  });

  it('says plainly when nothing was deleted, and where to find card ids', () => {
    const text = formatDeletedCards(
      toDeletedCards(DECK, 5, { ...NONE, notFound: [id(8)] }, WEB_URL),
    );

    expect(text).toBe(
      `No cards were deleted from the deck "Spanish verbs" (id: ${DECK.id}): none of these ids is in it (already deleted, or never there). Find card ids with get_deck or search_cards.`,
    );
  });
});
