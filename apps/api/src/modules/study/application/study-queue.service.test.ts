import { describe, expect, it } from 'vitest';
import { createStudyTestKit } from '../testing/study-test-kit.js';

const APP = { source: 'app', clientName: null } as const;
const DAY = 24 * 60 * 60 * 1000;

describe('StudyQueueService.getDueCards', () => {
  it('returns new cards oriented front to back with a next-due hint per rating', async () => {
    const kit = createStudyTestKit();
    await kit.seedDeck('ana', [{ front: 'hablar', back: 'to speak' }]);

    const { cards, totalDue } = await kit.queue.getDueCards('ana', { limit: 10 });

    expect(totalDue).toBe(1);
    expect(cards[0]).toMatchObject({
      prompt: 'hablar',
      answer: 'to speak',
      direction: 'forward',
      state: 'new',
    });
    const hints = cards[0]!.nextDue;
    expect(new Date(hints.again).getTime()).toBeLessThan(new Date(hints.easy).getTime());
  });

  it('shows a card rated easy again once it is due, not before', async () => {
    const kit = createStudyTestKit();
    const deck = await kit.seedDeck('ana', [{}]);
    const [card] = (await kit.queue.getDueCards('ana', { limit: 1 })).cards;
    const result = await kit.reviews.submit({
      userId: 'ana',
      command: { deckId: deck.id, cardId: card!.cardId, direction: 'forward', rating: 'easy' },
      provenance: APP,
    });

    expect((await kit.queue.getDueCards('ana', { limit: 10 })).totalDue).toBe(0);
    kit.clock.advance(new Date(result.nextDueAt).getTime() - kit.clock.now().getTime() + DAY);
    const later = await kit.queue.getDueCards('ana', { limit: 10 });
    expect(later.cards[0]).toMatchObject({ cardId: card!.cardId, state: 'review' });
  });

  it('asks a reversible card back to front on another day', async () => {
    const kit = createStudyTestKit();
    const deck = await kit.seedDeck('ana', [{ type: 'reversible', front: 'gato', back: 'cat' }]);
    const [forward] = (await kit.queue.getDueCards('ana', { limit: 5 })).cards;
    await kit.reviews.submit({
      userId: 'ana',
      command: { deckId: deck.id, cardId: forward!.cardId, direction: 'forward', rating: 'easy' },
      provenance: APP,
    });
    expect((await kit.queue.getDueCards('ana', { limit: 5 })).totalDue).toBe(0);

    kit.clock.advance(DAY);
    const [reverse] = (await kit.queue.getDueCards('ana', { limit: 5 })).cards;

    expect(reverse).toMatchObject({ direction: 'reverse', prompt: 'cat', answer: 'gato' });
  });

  it('limits the page but reports everything that is due', async () => {
    const kit = createStudyTestKit();
    await kit.seedDeck('ana', [{}, {}, {}]);

    const page = await kit.queue.getDueCards('ana', { limit: 2 });

    expect(page.cards).toHaveLength(2);
    expect(page.totalDue).toBe(3);
  });

  it('rejects a deck the user does not own with DECK_NOT_FOUND', async () => {
    const kit = createStudyTestKit();
    const deck = await kit.seedDeck('ana', [{}]);

    await expect(kit.queue.getDueCards('ben', { deckId: deck.id, limit: 5 })).rejects.toMatchObject(
      {
        code: 'DECK_NOT_FOUND',
      },
    );
  });
});

describe('StudyQueueService.getToday', () => {
  it('counts new cards and due reviews per deck and in total', async () => {
    const kit = createStudyTestKit();
    const deck = await kit.seedDeck('ana', [{}, {}]);

    const today = await kit.queue.getToday('ana');

    expect(today.decks).toEqual([
      { deckId: deck.id, title: 'Spanish', dueReviews: 0, newCards: 2 },
    ]);
    expect(today.totals).toEqual({ dueReviews: 0, newCards: 2 });
    expect(today).toMatchObject({ reviewedToday: 0, streakDays: 0 });
  });

  it('starts a streak with the first review of the day', async () => {
    const kit = createStudyTestKit();
    const deck = await kit.seedDeck('ana', [{}]);
    const [card] = (await kit.queue.getDueCards('ana', { limit: 1 })).cards;
    await kit.reviews.submit({
      userId: 'ana',
      command: { deckId: deck.id, cardId: card!.cardId, direction: 'forward', rating: 'good' },
      provenance: APP,
    });

    expect(await kit.queue.getToday('ana')).toMatchObject({ reviewedToday: 1, streakDays: 1 });
  });
});
