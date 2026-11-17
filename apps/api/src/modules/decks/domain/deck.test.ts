import { describe, expect, it } from 'vitest';
import { applyDeckPatch, canManageDeck, createDeck, softDeleteDeck } from './deck.js';

const created = new Date('2026-11-17T10:00:00Z');
const later = new Date('2026-11-17T11:00:00Z');

const deck = createDeck({
  id: 'deck-1',
  ownerId: 'user-1',
  command: { title: 'Spanish verbs', description: '', language: 'es', tags: ['spanish'] },
  now: created,
});

describe('createDeck', () => {
  it('creates a private, undeleted deck stamped with the creation time', () => {
    expect(deck).toMatchObject({
      visibility: 'private',
      deletedAt: null,
      createdAt: created,
      updatedAt: created,
    });
  });
});

describe('applyDeckPatch', () => {
  it('changes only the patched fields and bumps updatedAt', () => {
    const edited = applyDeckPatch(deck, { title: 'Spanish irregular verbs' }, later);

    expect(edited).toMatchObject({
      title: 'Spanish irregular verbs',
      language: 'es',
      updatedAt: later,
      createdAt: created,
    });
  });

  it('does not mutate the original deck', () => {
    applyDeckPatch(deck, { title: 'Changed' }, later);

    expect(deck.title).toBe('Spanish verbs');
  });
});

describe('canManageDeck', () => {
  it('lets the owner manage the deck', () => {
    expect(canManageDeck(deck, 'user-1')).toBe(true);
  });

  it('refuses another user', () => {
    expect(canManageDeck(deck, 'user-2')).toBe(false);
  });

  it('refuses everyone once the deck is soft-deleted', () => {
    expect(canManageDeck(softDeleteDeck(deck, later), 'user-1')).toBe(false);
  });
});
