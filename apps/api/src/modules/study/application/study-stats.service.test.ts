import { describe, expect, it } from 'vitest';
import { createStudyTestKit } from '../testing/study-test-kit.js';

const APP = { source: 'app', clientName: null } as const;

describe('StudyStatsService.getStats', () => {
  it('reports zeros and no retention before any review', async () => {
    const kit = createStudyTestKit();

    expect(await kit.stats.getStats('ana')).toEqual({
      streakDays: 0,
      reviewedToday: 0,
      totalReviews: 0,
      retention30d: null,
      weakCards: [],
    });
  });

  it('counts today’s reviews, ignores undone ones, and keeps other users apart', async () => {
    const kit = createStudyTestKit();
    const deck = await kit.seedDeck('ana', [{}, {}]);
    const cards = (await kit.queue.getDueCards('ana', { limit: 5 })).cards;
    for (const card of cards) {
      await kit.reviews.submit({
        userId: 'ana',
        command: { deckId: deck.id, cardId: card.cardId, direction: 'forward', rating: 'good' },
        provenance: APP,
      });
    }
    await kit.reviews.undoLast('ana');

    expect(await kit.stats.getStats('ana')).toMatchObject({
      reviewedToday: 1,
      totalReviews: 1,
      streakDays: 1,
    });
    expect((await kit.stats.getStats('ben')).totalReviews).toBe(0);
  });
});

describe('StudyStatsService weak cards', () => {
  /** Rates one side of a card, as the app would. */
  const rate = (
    kit: ReturnType<typeof createStudyTestKit>,
    card: { deckId: string; cardId: string; direction?: 'forward' | 'reverse' },
    rating: 'again' | 'good',
  ) =>
    kit.reviews.submit({
      userId: 'ana',
      command: { direction: 'forward', ...card, rating },
      provenance: APP,
    });

  it('lists a card forgotten twice, oriented, with how often and when it was last forgotten', async () => {
    const kit = createStudyTestKit();
    const deck = await kit.seedDeck('ana', [
      { front: 'hablar', back: 'to speak', extra: '-ar' },
      {},
    ]);
    const [hablar, other] = (await kit.queue.getDueCards('ana', { limit: 5 })).cards;
    await rate(kit, { deckId: deck.id, cardId: hablar!.cardId }, 'again');
    await rate(kit, { deckId: deck.id, cardId: other!.cardId }, 'again');
    kit.clock.advance(60_000);
    await rate(kit, { deckId: deck.id, cardId: hablar!.cardId }, 'again');

    expect((await kit.stats.getStats('ana')).weakCards).toEqual([
      {
        deckId: deck.id,
        deckTitle: 'Spanish',
        cardId: hablar!.cardId,
        direction: 'forward',
        cardType: 'basic',
        prompt: 'hablar',
        answer: 'to speak',
        extra: '-ar',
        forgotten: 2,
        lastForgottenAt: kit.clock.now().toISOString(),
      },
    ]);
  });

  it('asks the back of a reversible card when its reverse side is the weak one', async () => {
    const kit = createStudyTestKit();
    const deck = await kit.seedDeck('ana', [{ type: 'reversible', front: 'ser', back: 'to be' }]);
    const [card] = (await kit.queue.getDueCards('ana', { limit: 5 })).cards;
    for (let time = 0; time < 2; time += 1)
      await rate(kit, { deckId: deck.id, cardId: card!.cardId, direction: 'reverse' }, 'again');

    expect((await kit.stats.getStats('ana')).weakCards[0]).toMatchObject({
      direction: 'reverse',
      prompt: 'to be',
      answer: 'ser',
    });
  });

  it('skips a deleted card and keeps other users’ cards out', async () => {
    const kit = createStudyTestKit();
    const deck = await kit.seedDeck('ana', [{}]);
    const [card] = (await kit.queue.getDueCards('ana', { limit: 5 })).cards;
    for (let time = 0; time < 2; time += 1)
      await rate(kit, { deckId: deck.id, cardId: card!.cardId }, 'again');
    expect((await kit.stats.getStats('ben')).weakCards).toEqual([]);

    await kit.cardService.remove('ana', { deckId: deck.id, cardId: card!.cardId });

    expect((await kit.stats.getStats('ana')).weakCards).toEqual([]);
  });

  it('shows at most five, and forgets a slip once it is older than 30 days', async () => {
    const kit = createStudyTestKit();
    const deck = await kit.seedDeck(
      'ana',
      Array.from({ length: 6 }, () => ({})),
    );
    const cards = (await kit.queue.getDueCards('ana', { limit: 10 })).cards;
    for (const card of cards)
      for (let time = 0; time < 2; time += 1)
        await rate(kit, { deckId: deck.id, cardId: card.cardId }, 'again');

    expect((await kit.stats.getStats('ana')).weakCards).toHaveLength(5);

    kit.clock.advance(31 * 24 * 60 * 60 * 1000);

    expect((await kit.stats.getStats('ana')).weakCards).toEqual([]);
  });
});
