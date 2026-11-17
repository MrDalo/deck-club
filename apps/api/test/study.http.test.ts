import {
  CLIENT_NAME_HEADER,
  type Deck,
  type DueCards,
  type ProblemDetails,
  type ReviewResult,
  type StudyStats,
  type Today,
} from '@deck-club/contracts';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, signedInAs } from './test-app.js';

let app: NestFastifyApplication;

beforeEach(async () => {
  app = await createTestApp();
});

afterEach(async () => {
  await app.close();
});

async function deckWithCards(
  userId: string,
  cards: { front: string; back: string; type?: string }[],
): Promise<Deck> {
  const deck = (
    await app.inject({
      method: 'POST',
      url: '/decks',
      headers: signedInAs(userId),
      payload: { title: 'Spanish' },
    })
  ).json<Deck>();
  await app.inject({
    method: 'POST',
    url: `/decks/${deck.id}/cards/batch`,
    headers: signedInAs(userId),
    payload: { cards },
  });
  return deck;
}

const due = async (userId: string, query = ''): Promise<DueCards> =>
  (
    await app.inject({ method: 'GET', url: `/study/due${query}`, headers: signedInAs(userId) })
  ).json<DueCards>();

describe('study over HTTP, on real SQLite', () => {
  it('requires a signed-in user', async () => {
    const response = await app.inject({ method: 'GET', url: '/study/today' });

    expect(response.json<ProblemDetails>().code).toBe('UNAUTHENTICATED');
  });

  it('reviews a due card, persists the schedule, and undo puts it back in the queue', async () => {
    const deck = await deckWithCards('ana', [{ front: 'hablar', back: 'to speak' }]);
    const [card] = (await due('ana', `?deckId=${deck.id}`)).cards;
    expect(card).toMatchObject({ prompt: 'hablar', deckTitle: 'Spanish' });

    const reviewed = await app.inject({
      method: 'POST',
      url: '/study/reviews',
      headers: { ...signedInAs('ana'), [CLIENT_NAME_HEADER]: 'Claude' },
      payload: { deckId: deck.id, cardId: card!.cardId, rating: 'easy' },
    });
    expect(reviewed.statusCode).toBe(201);
    expect(reviewed.json<ReviewResult>().state).toBe('review');
    expect((await due('ana')).totalDue).toBe(0);

    const undone = await app.inject({
      method: 'POST',
      url: '/study/reviews/undo',
      headers: signedInAs('ana'),
    });
    expect(undone.statusCode).toBe(200);
    expect((await due('ana')).cards[0]).toMatchObject({ cardId: card!.cardId, state: 'new' });
  });

  it('keeps the schedule of a twice-reviewed card through undo of the second rating', async () => {
    const deck = await deckWithCards('ana', [{ front: 'a', back: 'b' }]);
    const [card] = (await due('ana')).cards;
    const rate = (rating: string) =>
      app.inject({
        method: 'POST',
        url: '/study/reviews',
        headers: signedInAs('ana'),
        payload: { deckId: deck.id, cardId: card!.cardId, rating },
      });
    await rate('again');
    const afterAgain = (await due('ana')).cards[0];
    await rate('good');

    await app.inject({ method: 'POST', url: '/study/reviews/undo', headers: signedInAs('ana') });

    // The restored schedule is the one after "again": still in learning, not the longer one "good" gave.
    expect(afterAgain?.state).toBe('learning');
    expect((await due('ana')).cards[0]).toMatchObject({ cardId: card!.cardId, state: 'learning' });
  });

  it('reports Today counts and stats after a review', async () => {
    const deck = await deckWithCards('ana', [
      { front: 'a', back: 'b' },
      { front: 'c', back: 'd' },
    ]);
    const [card] = (await due('ana')).cards;
    await app.inject({
      method: 'POST',
      url: '/study/reviews',
      headers: signedInAs('ana'),
      payload: { deckId: deck.id, cardId: card!.cardId, rating: 'easy', durationMs: 4200 },
    });

    const today = (
      await app.inject({ method: 'GET', url: '/study/today', headers: signedInAs('ana') })
    ).json<Today>();
    const stats = (
      await app.inject({ method: 'GET', url: '/study/stats', headers: signedInAs('ana') })
    ).json<StudyStats>();

    expect(today).toMatchObject({
      totals: { newCards: 1, dueReviews: 0 },
      reviewedToday: 1,
      streakDays: 1,
    });
    expect(stats).toMatchObject({
      totalReviews: 1,
      reviewedToday: 1,
      streakDays: 1,
      retention30d: null,
    });
  });

  it('rejects an invalid rating with VALIDATION_FAILED', async () => {
    const deck = await deckWithCards('ana', [{ front: 'a', back: 'b' }]);
    const [card] = (await due('ana')).cards;

    const response = await app.inject({
      method: 'POST',
      url: '/study/reviews',
      headers: signedInAs('ana'),
      payload: { deckId: deck.id, cardId: card!.cardId, rating: 'perfect' },
    });

    expect(response.json<ProblemDetails>()).toMatchObject({
      status: 400,
      code: 'VALIDATION_FAILED',
    });
  });

  it('rejects undo with nothing to undo with NOTHING_TO_UNDO (409)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/study/reviews/undo',
      headers: signedInAs('ana'),
    });

    expect(response.json<ProblemDetails>()).toMatchObject({ status: 409, code: 'NOTHING_TO_UNDO' });
  });

  it('never shows one user’s due cards to another', async () => {
    await deckWithCards('ana', [{ front: 'a', back: 'b' }]);

    expect((await due('ben')).totalDue).toBe(0);
  });
});
