import { describe, expect, it } from 'vitest';
import { AppError } from '../../../common/errors/app-error.js';
import { createDecksTestKit } from '../testing/decks-test-kit.js';

const command = { title: 'Spanish verbs', description: '', language: 'es', tags: [] };

describe('DeckService', () => {
  it('creates a private deck with no cards for its owner', async () => {
    const { deckService } = createDecksTestKit();

    const deck = await deckService.create('user-1', command);

    expect(deck).toMatchObject({ title: 'Spanish verbs', visibility: 'private', cardCount: 0 });
  });

  it('lists only the caller’s decks, most recently changed first', async () => {
    const { deckService, clock } = createDecksTestKit();
    await deckService.create('user-1', { ...command, title: 'Older' });
    clock.advance(1000);
    await deckService.create('user-1', { ...command, title: 'Newer' });
    await deckService.create('user-2', { ...command, title: 'Someone else' });

    const decks = await deckService.list('user-1');

    expect(decks.map((deck) => deck.title)).toEqual(['Newer', 'Older']);
  });

  it('rejects reading another user’s deck with DECK_NOT_FOUND', async () => {
    const { deckService } = createDecksTestKit();
    const deck = await deckService.create('user-1', command);

    await expect(deckService.get('user-2', deck.id)).rejects.toMatchObject({
      code: 'DECK_NOT_FOUND',
    });
  });

  it('rejects an unknown deck id with DECK_NOT_FOUND', async () => {
    const { deckService } = createDecksTestKit();

    await expect(
      deckService.get('user-1', '00000000-0000-4000-8000-999999999999'),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('updates the patched fields and the timestamp', async () => {
    const { deckService, clock } = createDecksTestKit();
    const deck = await deckService.create('user-1', command);
    clock.advance(60_000);

    const updated = await deckService.update('user-1', deck.id, { title: 'Irregular verbs' });

    expect(updated.title).toBe('Irregular verbs');
    expect(updated.updatedAt).not.toBe(deck.updatedAt);
  });

  it('rejects updating another user’s deck with DECK_NOT_FOUND', async () => {
    const { deckService } = createDecksTestKit();
    const deck = await deckService.create('user-1', command);

    await expect(
      deckService.update('user-2', deck.id, { title: 'Hijacked' }),
    ).rejects.toMatchObject({ code: 'DECK_NOT_FOUND' });
  });

  it('soft-deletes a deck so it disappears from the library but stays stored', async () => {
    const { deckService, store } = createDecksTestKit();
    const deck = await deckService.create('user-1', command);

    await deckService.remove('user-1', deck.id);

    expect(await deckService.list('user-1')).toEqual([]);
    expect(store.decks.get(deck.id)?.deletedAt).toBeInstanceOf(Date);
  });
});
