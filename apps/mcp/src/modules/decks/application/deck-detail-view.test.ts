import { describe, expect, it } from 'vitest';
import { testCard, testDeck } from '../testing/fake-decks-api.js';
import { formatDeckDetail, toDeckCard, toDeckDetail } from './deck-detail-view.js';
import { decodeCursor } from './deck-page.js';

const WEB_URL = 'https://deck.club';
const DECK_ID = '00000000-0000-4000-8000-000000000001';
const card = (index: number): ReturnType<typeof testCard> =>
  testCard({
    id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    deckId: DECK_ID,
    front: `front ${index}`,
    back: `back ${index}`,
  });
const deckWith = (cardCount: number): ReturnType<typeof testDeck> =>
  testDeck({ id: DECK_ID, title: 'Spanish verbs', language: 'es', cardCount });

describe('toDeckCard', () => {
  it('credits the AI client that added a card', () => {
    const added = toDeckCard({ ...card(1), provenance: { source: 'mcp', clientName: 'Claude' } });

    expect(added.addedBy).toBe('Claude');
  });

  it('credits an unnamed AI client generically', () => {
    expect(
      toDeckCard({ ...card(1), provenance: { source: 'mcp', clientName: null } }).addedBy,
    ).toBe('an AI assistant');
  });

  it('credits no one for a card a person wrote', () => {
    expect(toDeckCard(card(1)).addedBy).toBeNull();
  });

  it('keeps the content and drops timestamps and deck id', () => {
    expect(
      toDeckCard({ ...card(1), extra: 'e.g. hablo', tags: ['verbs'], type: 'reversible' }),
    ).toEqual({
      id: card(1).id,
      type: 'reversible',
      front: 'front 1',
      back: 'back 1',
      extra: 'e.g. hablo',
      tags: ['verbs'],
      addedBy: null,
    });
  });
});

describe('toDeckDetail', () => {
  it('returns the deck with its link and the first page of cards', () => {
    const cards = Array.from({ length: 30 }, (_, index) => card(index + 1));

    const detail = toDeckDetail(deckWith(30), cards, 0, WEB_URL);

    expect(detail.deck).toMatchObject({ id: DECK_ID, url: `https://deck.club/decks/${DECK_ID}` });
    expect(detail.cards).toHaveLength(25);
    expect(detail.firstCardNumber).toBe(1);
    expect(decodeCursor(DECK_ID, detail.nextCursor ?? undefined)).toBe(25);
  });

  it('returns a later page from an offset', () => {
    const cards = Array.from({ length: 30 }, (_, index) => card(index + 1));

    const detail = toDeckDetail(deckWith(30), cards, 25, WEB_URL);

    expect(detail.cards.map((each) => each.front)).toEqual([
      'front 26',
      'front 27',
      'front 28',
      'front 29',
      'front 30',
    ]);
    expect(detail).toMatchObject({ firstCardNumber: 26, nextCursor: null });
  });
});

describe('formatDeckDetail', () => {
  it('writes the header and one numbered line per card', () => {
    const cards = [
      {
        ...card(1),
        extra: 'yo hablo',
        tags: ['verbs', 'a1'],
        provenance: { source: 'mcp' as const, clientName: 'Claude' },
      },
      card(2),
    ];

    const text = formatDeckDetail(toDeckDetail(deckWith(2), cards, 0, WEB_URL));

    expect(text).toBe(
      [
        `Deck "Spanish verbs" (id: ${DECK_ID}, language: es, 2 cards) https://deck.club/decks/${DECK_ID}`,
        'Cards 1–2 of 2:',
        '1. [basic] front: front 1 | back: back 1 | extra: yo hablo | tags: verbs, a1 | added by Claude',
        '2. [basic] front: front 2 | back: back 2',
      ].join('\n'),
    );
  });

  it('includes the description when the deck has one', () => {
    const deck = { ...deckWith(0), description: 'A1 vocabulary' };

    expect(formatDeckDetail(toDeckDetail(deck, [], 0, WEB_URL))).toContain('About: A1 vocabulary');
  });

  it('tells the AI how to read the next page', () => {
    const cards = Array.from({ length: 30 }, (_, index) => card(index + 1));
    const detail = toDeckDetail(deckWith(30), cards, 0, WEB_URL);

    const text = formatDeckDetail(detail);

    expect(text).toContain('Cards 1–25 of 30:');
    expect(text).toContain(
      `More cards: call get_deck again with cursor "${detail.nextCursor ?? ''}".`,
    );
  });

  it('guides the AI to add cards to an empty deck', () => {
    expect(formatDeckDetail(toDeckDetail(deckWith(0), [], 0, WEB_URL))).toContain(
      'It has no cards yet. Use add_cards to add some.',
    );
  });

  it('says the deck is exhausted when a cursor points past the end', () => {
    expect(formatDeckDetail(toDeckDetail(deckWith(2), [card(1), card(2)], 25, WEB_URL))).toContain(
      'There are no more cards in this deck.',
    );
  });
});
