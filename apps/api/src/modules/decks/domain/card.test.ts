import { describe, expect, it } from 'vitest';
import { applyCardPatch, createCard, softDeleteCard } from './card.js';

const created = new Date('2026-11-17T10:00:00Z');
const later = new Date('2026-11-17T11:00:00Z');

const card = createCard({
  id: 'card-1',
  deckId: 'deck-1',
  command: { type: 'basic', front: 'hablar', back: 'to speak', extra: '', tags: [] },
  provenance: { source: 'mcp', clientName: 'Claude' },
  now: created,
});

describe('createCard', () => {
  it('starts at version 1 with the given provenance', () => {
    expect(card).toMatchObject({
      version: 1,
      provenance: { source: 'mcp', clientName: 'Claude' },
      deletedAt: null,
    });
  });
});

describe('applyCardPatch', () => {
  it('bumps the version on a content edit', () => {
    expect(applyCardPatch(card, { back: 'to talk' }, later)).toMatchObject({
      back: 'to talk',
      version: 2,
      updatedAt: later,
    });
  });

  it('keeps the original provenance when someone else edits', () => {
    expect(applyCardPatch(card, { front: 'hablar (v.)' }, later).provenance.clientName).toBe(
      'Claude',
    );
  });
});

describe('softDeleteCard', () => {
  it('marks the card deleted without losing its content', () => {
    expect(softDeleteCard(card, later)).toMatchObject({ deletedAt: later, front: 'hablar' });
  });
});
