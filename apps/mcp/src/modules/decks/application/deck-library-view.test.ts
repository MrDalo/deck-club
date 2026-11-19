import { describe, expect, it } from 'vitest';
import { testDeck } from '../testing/fake-decks-api.js';
import { formatDeckLibrary, toDeckLibrary } from './deck-library-view.js';

const WEB_URL = 'https://deck.club';
const SPANISH = testDeck({
  id: '00000000-0000-4000-8000-000000000001',
  title: 'Spanish verbs',
  description: 'A1 vocabulary',
  language: 'es',
  cardCount: 42,
});
const BIOLOGY = testDeck({
  id: '00000000-0000-4000-8000-000000000002',
  title: 'Biology',
  cardCount: 1,
});

describe('toDeckLibrary', () => {
  it('keeps what the AI and the view need, and drops the rest', () => {
    const library = toDeckLibrary([SPANISH], WEB_URL);

    expect(library).toEqual({
      decks: [
        {
          id: SPANISH.id,
          title: 'Spanish verbs',
          description: 'A1 vocabulary',
          language: 'es',
          cardCount: 42,
          url: `https://deck.club/decks/${SPANISH.id}`,
        },
      ],
      deckCount: 1,
      libraryUrl: 'https://deck.club/decks',
    });
  });

  it('keeps the API’s order and counts an empty library', () => {
    expect(toDeckLibrary([SPANISH, BIOLOGY], WEB_URL).decks.map((deck) => deck.title)).toEqual([
      'Spanish verbs',
      'Biology',
    ]);
    expect(toDeckLibrary([], WEB_URL)).toMatchObject({ decks: [], deckCount: 0 });
  });
});

describe('formatDeckLibrary', () => {
  it('writes one line per deck with the id the AI needs next', () => {
    const text = formatDeckLibrary(toDeckLibrary([SPANISH, BIOLOGY], WEB_URL));

    expect(text).toBe(
      [
        'The user has 2 decks:',
        `- "Spanish verbs" (id: ${SPANISH.id}, language: es, 42 cards) https://deck.club/decks/${SPANISH.id}`,
        `- "Biology" (id: ${BIOLOGY.id}, language: en, 1 card) https://deck.club/decks/${BIOLOGY.id}`,
      ].join('\n'),
    );
  });

  it('says "1 deck" for a single deck', () => {
    expect(formatDeckLibrary(toDeckLibrary([SPANISH], WEB_URL))).toContain('The user has 1 deck:');
  });

  it('guides the AI to create one when the library is empty', () => {
    expect(formatDeckLibrary(toDeckLibrary([], WEB_URL))).toBe(
      'The user has no decks yet. Offer to create one with create_deck.',
    );
  });
});
