import { describe, expect, it } from 'vitest';
import { createStudyTestKit } from '../testing/study-test-kit.js';

const APP = { source: 'app', clientName: null } as const;
const CLAUDE = { source: 'mcp', clientName: 'Claude' } as const;
const HOUR = 60 * 60 * 1000;

describe('ReviewService.submit', () => {
  it('schedules a new card rated good into the future and logs the review', async () => {
    const kit = await createStudyTestKit();
    const deck = await kit.seedDeck('ana', [{ front: 'hablar', back: 'to speak' }]);
    const { cards } = await kit.queue.getDueCards('ana', { limit: 10 });
    const card = cards[0]!;

    const result = await kit.reviews.submit({
      userId: 'ana',
      command: { deckId: deck.id, cardId: card.cardId, direction: 'forward', rating: 'good' },
      provenance: APP,
    });

    expect(result.state).toBe('review');
    expect(new Date(result.nextDueAt).getTime()).toBeGreaterThan(
      kit.clock.now().getTime() + 24 * HOUR,
    );
    expect(kit.study.reviews).toHaveLength(1);
    expect(kit.study.reviews[0]?.previousMemory).toBeNull();
  });

  it('records the AI client as the review source', async () => {
    const kit = await createStudyTestKit();
    const deck = await kit.seedDeck('ana', [{}]);
    const [card] = (await kit.queue.getDueCards('ana', { limit: 1 })).cards;

    await kit.reviews.submit({
      userId: 'ana',
      command: { deckId: deck.id, cardId: card!.cardId, direction: 'forward', rating: 'again' },
      provenance: CLAUDE,
    });

    expect(kit.study.reviews[0]).toMatchObject({
      source: 'mcp',
      clientName: 'Claude',
      rating: 'again',
    });
  });

  it('rejects reviewing another user’s card with DECK_NOT_FOUND', async () => {
    const kit = await createStudyTestKit();
    const deck = await kit.seedDeck('ana', [{}]);
    const [card] = (await kit.queue.getDueCards('ana', { limit: 1 })).cards;

    await expect(
      kit.reviews.submit({
        userId: 'ben',
        command: { deckId: deck.id, cardId: card!.cardId, direction: 'forward', rating: 'good' },
        provenance: APP,
      }),
    ).rejects.toMatchObject({ code: 'DECK_NOT_FOUND' });
  });

  it('rejects the reverse direction of a basic card with DIRECTION_NOT_STUDIED', async () => {
    const kit = await createStudyTestKit();
    const deck = await kit.seedDeck('ana', [{ type: 'basic' }]);
    const [card] = (await kit.queue.getDueCards('ana', { limit: 1 })).cards;

    await expect(
      kit.reviews.submit({
        userId: 'ana',
        command: { deckId: deck.id, cardId: card!.cardId, direction: 'reverse', rating: 'good' },
        provenance: APP,
      }),
    ).rejects.toMatchObject({ code: 'DIRECTION_NOT_STUDIED' });
  });

  it('rejects a card id that is not in the deck with CARD_NOT_FOUND', async () => {
    const kit = await createStudyTestKit();
    const deck = await kit.seedDeck('ana', [{}]);

    await expect(
      kit.reviews.submit({
        userId: 'ana',
        command: {
          deckId: deck.id,
          cardId: '00000000-0000-4000-8000-999999999999',
          direction: 'forward',
          rating: 'good',
        },
        provenance: APP,
      }),
    ).rejects.toMatchObject({ code: 'CARD_NOT_FOUND' });
  });
});

describe('ReviewService.undoLast', () => {
  it('restores the exact previous schedule, so the card is due again', async () => {
    const kit = await createStudyTestKit();
    const deck = await kit.seedDeck('ana', [{}]);
    const [card] = (await kit.queue.getDueCards('ana', { limit: 1 })).cards;
    await kit.reviews.submit({
      userId: 'ana',
      command: { deckId: deck.id, cardId: card!.cardId, direction: 'forward', rating: 'easy' },
      provenance: APP,
    });
    expect((await kit.queue.getDueCards('ana', { limit: 10 })).totalDue).toBe(0);

    const undone = await kit.reviews.undoLast('ana');

    expect(undone).toMatchObject({ cardId: card!.cardId, direction: 'forward' });
    expect((await kit.queue.getDueCards('ana', { limit: 10 })).totalDue).toBe(1);
    expect(kit.study.reviews[0]?.undoneAt).toBeInstanceOf(Date);
  });

  it('rejects undo with nothing reviewed today with NOTHING_TO_UNDO', async () => {
    const kit = await createStudyTestKit();

    await expect(kit.reviews.undoLast('ana')).rejects.toMatchObject({ code: 'NOTHING_TO_UNDO' });
  });

  it('rejects undoing a review from a previous day with NOTHING_TO_UNDO', async () => {
    const kit = await createStudyTestKit();
    const deck = await kit.seedDeck('ana', [{}]);
    const [card] = (await kit.queue.getDueCards('ana', { limit: 1 })).cards;
    await kit.reviews.submit({
      userId: 'ana',
      command: { deckId: deck.id, cardId: card!.cardId, direction: 'forward', rating: 'good' },
      provenance: APP,
    });
    kit.clock.advance(30 * HOUR);

    await expect(kit.reviews.undoLast('ana')).rejects.toMatchObject({ code: 'NOTHING_TO_UNDO' });
  });
});
