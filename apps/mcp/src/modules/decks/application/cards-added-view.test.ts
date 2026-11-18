import type { Card } from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import { testCard, testDeck } from '../testing/fake-decks-api.js';
import { formatCardsAdded, toCardsAdded } from './cards-added-view.js';
import { decodeCursor } from './deck-page.js';

const WEB_URL = 'https://deck.club';
const DECK_ID = '00000000-0000-4000-8000-000000000001';
const cardId = (index: number): string =>
  `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
const card = (index: number, overrides: Partial<Card> = {}): Card =>
  testCard({ id: cardId(index), deckId: DECK_ID, front: `front ${index}`, ...overrides });
const byClaude = (index: number, overrides: Partial<Card> = {}): Card =>
  card(index, { provenance: { source: 'mcp', clientName: 'Claude' }, ...overrides });

/** The deck before the write: two cards a person wrote. */
const BEFORE = testDeck({ id: DECK_ID, title: 'Spanish verbs', language: 'es', cardCount: 2 });
const EXISTING = [card(1), card(2)];

describe('toCardsAdded', () => {
  it('starts the page at the first card just added, with the deck’s new count', () => {
    const added = [byClaude(10), byClaude(11)];

    expect(toCardsAdded(BEFORE, [...EXISTING, ...added], added, WEB_URL)).toEqual({
      deck: {
        id: DECK_ID,
        title: 'Spanish verbs',
        description: '',
        language: 'es',
        cardCount: 4,
        url: `https://deck.club/decks/${DECK_ID}`,
      },
      cards: [
        expect.objectContaining({ id: cardId(10), front: 'front 10', addedBy: 'Claude' }),
        expect.objectContaining({ id: cardId(11), front: 'front 11', addedBy: 'Claude' }),
      ],
      firstCardNumber: 3,
      nextCursor: null,
      addedCount: 2,
    });
  });

  it('shows the new cards in the deck’s own order, which the API may not keep for a batch', () => {
    const added = [byClaude(12), byClaude(10), byClaude(11)];
    const deckOrder = [...EXISTING, byClaude(10), byClaude(11), byClaude(12)];

    const output = toCardsAdded(BEFORE, deckOrder, added, WEB_URL);

    expect(output.firstCardNumber).toBe(3);
    expect(output.cards.map((each) => each.id)).toEqual([cardId(10), cardId(11), cardId(12)]);
  });

  it('pages a large batch like get_deck, with a cursor to the rest of it', () => {
    const added = Array.from({ length: 30 }, (_, index) => byClaude(100 + index));

    const output = toCardsAdded(BEFORE, [...EXISTING, ...added], added, WEB_URL);

    expect(output.cards).toHaveLength(25);
    expect(output.addedCount).toBe(30);
    expect(output.nextCursor).not.toBeNull();
    expect(decodeCursor(DECK_ID, output.nextCursor ?? undefined)).toBe(2 + 25);
  });

  it('falls back to the cards as sent when the deck could not be read back', () => {
    const added = [byClaude(10), byClaude(11)];

    expect(toCardsAdded(BEFORE, null, added, WEB_URL)).toMatchObject({
      deck: { id: DECK_ID, cardCount: 4 },
      cards: [{ id: cardId(10) }, { id: cardId(11) }],
      firstCardNumber: 3,
      nextCursor: null,
      addedCount: 2,
    });
  });

  it('shows at most one page of a large batch when it could not read the deck back', () => {
    const added = Array.from({ length: 40 }, (_, index) => byClaude(100 + index));

    const output = toCardsAdded(BEFORE, null, added, WEB_URL);

    expect(output.cards).toHaveLength(25);
    expect(output.nextCursor).toBeNull();
    expect(output.deck.cardCount).toBe(42);
  });

  it('falls back too when the new cards are already gone from the deck it read', () => {
    const added = [byClaude(10)];

    expect(toCardsAdded(BEFORE, EXISTING, added, WEB_URL)).toMatchObject({
      cards: [{ id: cardId(10) }],
      firstCardNumber: 3,
      addedCount: 1,
    });
  });
});

describe('formatCardsAdded', () => {
  it('gives the AI the count, the new card ids in the order it sent them, and the link', () => {
    const added = [byClaude(11, { type: 'reversible', front: 'hablar' }), byClaude(10)];

    const text = formatCardsAdded(toCardsAdded(BEFORE, null, added, WEB_URL), added);

    expect(text).toBe(
      [
        `Added 2 cards to the deck "Spanish verbs" (id: ${DECK_ID}); it now has 4 cards.`,
        'New card ids, in the order you sent the cards:',
        `- ${cardId(11)}: [reversible] hablar`,
        `- ${cardId(10)}: [basic] front 10`,
        `Share the link with the user: https://deck.club/decks/${DECK_ID}`,
      ].join('\n'),
    );
  });

  it('says first that nothing was added twice when it answers a retry with the same key', () => {
    const added = [byClaude(10)];

    const lines = formatCardsAdded(toCardsAdded(BEFORE, null, added, WEB_URL), added, true).split(
      '\n',
    );

    expect(lines[0]).toBe(
      'Already done: an earlier add_cards call with this idempotencyKey added these cards, so none were added twice.',
    );
    expect(lines[1]).toMatch(/^Added 1 card to the deck "Spanish verbs"/);
  });

  it('says nothing about retries for a first call', () => {
    const added = [byClaude(10)];

    expect(formatCardsAdded(toCardsAdded(BEFORE, null, added, WEB_URL), added)).not.toContain(
      'Already done',
    );
  });

  it('says "1 card" for one', () => {
    const added = [byClaude(10)];
    const empty = testDeck({ id: DECK_ID, title: 'Spanish verbs' });

    expect(formatCardsAdded(toCardsAdded(empty, null, added, WEB_URL), added)).toMatch(
      /^Added 1 card to the deck "Spanish verbs" \(id: [0-9a-f-]{36}\); it now has 1 card\./,
    );
  });

  it('lists every new card, not only the page the view shows', () => {
    const added = Array.from({ length: 30 }, (_, index) => byClaude(100 + index));

    const text = formatCardsAdded(
      toCardsAdded(BEFORE, [...EXISTING, ...added], added, WEB_URL),
      added,
    );

    expect(text.match(/^- /gm)).toHaveLength(30);
  });

  it('keeps each line short: a long or multi-line front is folded and cut', () => {
    const front = `What is\n  ${'very '.repeat(40)}long?`;
    const added = [byClaude(10, { front })];

    const line = formatCardsAdded(toCardsAdded(BEFORE, null, added, WEB_URL), added)
      .split('\n')
      .find((each) => each.startsWith('- '));

    expect(line).toMatch(/^- [0-9a-f-]{36}: \[basic\] What is very very .*…$/);
    expect(line).not.toContain('\n');
    expect(line?.length).toBeLessThan(140);
  });
});
