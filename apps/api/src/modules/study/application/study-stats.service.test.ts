import { describe, expect, it } from 'vitest';
import { createStudyTestKit } from '../testing/study-test-kit.js';

const APP = { source: 'app', clientName: null } as const;

describe('StudyStatsService.getStats', () => {
  it('reports zeros and no retention before any review', async () => {
    const kit = await createStudyTestKit();

    expect(await kit.stats.getStats('ana')).toEqual({
      streakDays: 0,
      reviewedToday: 0,
      totalReviews: 0,
      retention30d: null,
    });
  });

  it('counts today’s reviews, ignores undone ones, and keeps other users apart', async () => {
    const kit = await createStudyTestKit();
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
