import { describe, expect, it } from 'vitest';
import { testDeck } from '../testing/fake-decks-api.js';
import { formatCreatedDeck, toCreatedDeck } from './deck-created-view.js';

const WEB_URL = 'https://deck.club';
const DECK = testDeck({
  id: '00000000-0000-4000-8000-000000000001',
  title: 'Spanish verbs',
  description: 'A1 verbs',
  language: 'es',
  tags: ['a1', 'verbs'],
});

describe('toCreatedDeck', () => {
  it('returns the deck with its link, tags and visibility, and the library link', () => {
    expect(toCreatedDeck(DECK, WEB_URL)).toEqual({
      deck: {
        id: DECK.id,
        title: 'Spanish verbs',
        description: 'A1 verbs',
        language: 'es',
        cardCount: 0,
        url: `https://deck.club/decks/${DECK.id}`,
        tags: ['a1', 'verbs'],
        visibility: 'private',
      },
      libraryUrl: 'https://deck.club/decks',
    });
  });
});

describe('formatCreatedDeck', () => {
  it('gives the AI the id for add_cards and the link to share', () => {
    expect(formatCreatedDeck(toCreatedDeck(DECK, WEB_URL))).toBe(
      [
        `Created the private deck "Spanish verbs" (id: ${DECK.id}, language: es, tags: a1, verbs).`,
        'It has no cards yet: add them with add_cards and this id.',
        `Share the link with the user: https://deck.club/decks/${DECK.id}`,
      ].join('\n'),
    );
  });

  it('leaves tags out when the deck has none', () => {
    expect(formatCreatedDeck(toCreatedDeck({ ...DECK, tags: [] }, WEB_URL))).toContain(
      `(id: ${DECK.id}, language: es).`,
    );
  });
});
