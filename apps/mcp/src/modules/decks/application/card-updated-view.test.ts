import type { Card, DeckCard } from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import { testCard, testDeck } from '../testing/fake-decks-api.js';
import { changedFieldsOf, formatUpdatedCard, toUpdatedCard } from './card-updated-view.js';

const WEB_URL = 'https://deck.club';
const DECK = testDeck({ id: '00000000-0000-4000-8000-000000000001', title: 'Spanish verbs' });
const CARD_ID = '00000000-0000-4000-8000-000000000002';
const BEFORE = testCard({
  id: CARD_ID,
  deckId: DECK.id,
  front: 'hablar',
  back: 'to speak',
  tags: ['verbs'],
  provenance: { source: 'mcp', clientName: 'Claude' },
});
const edited = (changes: Partial<Card>): Card => ({ ...BEFORE, ...changes });
const deckCard = (changes: Partial<DeckCard> = {}): DeckCard => ({
  id: CARD_ID,
  type: 'basic',
  front: 'hablar',
  back: 'to speak',
  extra: '',
  tags: ['verbs'],
  addedBy: 'Claude',
  ...changes,
});

describe('changedFieldsOf', () => {
  it('lists the fields that differ, in card order', () => {
    expect(
      changedFieldsOf(deckCard(), deckCard({ tags: ['verbs', 'a1'], front: 'hablar (v.)' })),
    ).toEqual(['front', 'tags']);
  });

  it('finds nothing when the values are the same', () => {
    expect(changedFieldsOf(deckCard(), deckCard())).toEqual([]);
  });

  it('compares tags in order and by value', () => {
    expect(changedFieldsOf(deckCard({ tags: ['a', 'b'] }), deckCard({ tags: ['a', 'b'] }))).toEqual(
      [],
    );
    expect(changedFieldsOf(deckCard({ tags: ['a', 'b'] }), deckCard({ tags: ['b', 'a'] }))).toEqual(
      ['tags'],
    );
    expect(changedFieldsOf(deckCard({ tags: ['a'] }), deckCard({ tags: [] }))).toEqual(['tags']);
  });
});

describe('toUpdatedCard', () => {
  it('returns the card as it is now and as it was, with its deck and what changed', () => {
    expect(toUpdatedCard(DECK, BEFORE, edited({ back: 'to talk' }), WEB_URL)).toEqual({
      deck: { id: DECK.id, title: 'Spanish verbs', url: `https://deck.club/decks/${DECK.id}` },
      card: deckCard({ back: 'to talk' }),
      previous: deckCard(),
      changedFields: ['back'],
    });
  });

  it('keeps who added the card: an edit never changes its author', () => {
    const output = toUpdatedCard(DECK, BEFORE, edited({ back: 'to talk' }), WEB_URL);

    expect([output.previous.addedBy, output.card.addedBy]).toEqual(['Claude', 'Claude']);
  });
});

describe('formatUpdatedCard', () => {
  it('gives the AI each change as before → after, the card now and the deck link', () => {
    const text = formatUpdatedCard(
      toUpdatedCard(
        DECK,
        BEFORE,
        edited({ back: 'to talk', extra: 'yo hablo', tags: [] }),
        WEB_URL,
      ),
    );

    expect(text).toBe(
      [
        `Updated the card ${CARD_ID} in the deck "Spanish verbs" (id: ${DECK.id}). The user's study progress on it is kept.`,
        '- back: "to speak" → "to talk"',
        '- extra: (empty) → "yo hablo"',
        '- tags: verbs → (no tags)',
        'Now: [basic] front: hablar | back: to talk | extra: yo hablo | added by Claude',
        `Share the link with the user: https://deck.club/decks/${DECK.id}`,
      ].join('\n'),
    );
  });

  it('says plainly when the card already had these values', () => {
    const text = formatUpdatedCard(toUpdatedCard(DECK, BEFORE, BEFORE, WEB_URL));

    expect(text.split('\n')[0]).toBe(
      `The card ${CARD_ID} in the deck "Spanish verbs" (id: ${DECK.id}) already had these values; nothing changed.`,
    );
    expect(text).not.toContain('→');
  });
});
