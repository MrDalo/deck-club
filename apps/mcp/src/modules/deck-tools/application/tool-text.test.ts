import type { Card, Deck } from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import { deckUrl, formatDeck, formatDeckList } from './tool-text.js';

const deck: Deck = {
  id: '00000000-0000-4000-8000-000000000001',
  title: 'Spanish',
  description: '',
  language: 'es',
  tags: [],
  visibility: 'private',
  cardCount: 1,
  createdAt: '2026-11-17T10:00:00.000Z',
  updatedAt: '2026-11-17T10:00:00.000Z',
};

const card: Card = {
  id: '00000000-0000-4000-8000-000000000002',
  deckId: deck.id,
  type: 'basic',
  front: 'hablar',
  back: 'to speak',
  extra: '',
  tags: [],
  provenance: { source: 'app', clientName: null },
  createdAt: deck.createdAt,
  updatedAt: deck.updatedAt,
};

describe('tool text', () => {
  it('links a deck in the web app', () => {
    expect(deckUrl('https://deck.club', deck.id)).toBe(`https://deck.club/decks/${deck.id}`);
  });

  it('lists each deck with its id and singular card count', () => {
    expect(formatDeckList([deck], 'https://deck.club')).toContain(
      `"Spanish" (id: ${deck.id}, language: es, 1 card)`,
    );
  });

  it('numbers the cards of a deck', () => {
    expect(formatDeck({ deck, cards: [card] }, 'https://deck.club')).toContain(
      '1. [basic] front: hablar | back: to speak',
    );
  });

  it('suggests add_cards for an empty deck', () => {
    expect(formatDeck({ deck, cards: [] }, 'https://deck.club')).toContain('add_cards');
  });
});
