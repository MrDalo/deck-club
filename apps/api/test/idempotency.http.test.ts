import {
  type CardList,
  type Deck,
  type DueCards,
  IDEMPOTENCY_KEY_HEADER,
  IDEMPOTENT_REPLAYED_HEADER,
  type ProblemDetails,
  type ReviewResult,
  type StudyStats,
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

const KEY = '5f0c6f2e-8f7a-4a4b-9a43-3c4b2f1e0d9c';
const CARDS = [
  { front: 'hablar', back: 'to speak' },
  { front: 'comer', back: 'to eat' },
];

async function createDeck(userId: string): Promise<Deck> {
  const response = await app.inject({
    method: 'POST',
    url: '/decks',
    headers: signedInAs(userId),
    payload: { title: 'Spanish verbs', language: 'es' },
  });
  return response.json<Deck>();
}

const addCards = (
  userId: string,
  deckId: string,
  key: string | undefined,
  cards: object[] = CARDS,
): ReturnType<NestFastifyApplication['inject']> =>
  app.inject({
    method: 'POST',
    url: `/decks/${deckId}/cards/batch`,
    headers: { ...signedInAs(userId), ...(key !== undefined && { [IDEMPOTENCY_KEY_HEADER]: key }) },
    payload: { cards },
  });

async function cardCount(userId: string, deckId: string): Promise<number> {
  const response = await app.inject({
    method: 'GET',
    url: `/decks/${deckId}/cards`,
    headers: signedInAs(userId),
  });
  return response.json<CardList>().cards.length;
}

describe('Idempotency-Key on POST /decks/:deckId/cards/batch, on real SQLite', () => {
  it('adds a retried batch once and replays the first response, marked as a replay', async () => {
    const deck = await createDeck('ana');

    const first = await addCards('ana', deck.id, KEY);
    const retry = await addCards('ana', deck.id, KEY);

    expect([first.statusCode, retry.statusCode]).toEqual([201, 201]);
    expect(retry.json()).toEqual(first.json());
    expect(first.headers[IDEMPOTENT_REPLAYED_HEADER]).toBeUndefined();
    expect(retry.headers[IDEMPOTENT_REPLAYED_HEADER]).toBe('true');
    expect(await cardCount('ana', deck.id)).toBe(2);
  });

  it('adds the batch twice when no key is sent, as before', async () => {
    const deck = await createDeck('ana');

    await addCards('ana', deck.id, undefined);
    await addCards('ana', deck.id, undefined);

    expect(await cardCount('ana', deck.id)).toBe(4);
  });

  it('refuses the same key with other cards with IDEMPOTENCY_KEY_REUSED and adds nothing', async () => {
    const deck = await createDeck('ana');
    await addCards('ana', deck.id, KEY);

    const response = await addCards('ana', deck.id, KEY, [{ front: 'vivir', back: 'to live' }]);

    expect(response.statusCode).toBe(422);
    expect(response.json<ProblemDetails>()).toMatchObject({ code: 'IDEMPOTENCY_KEY_REUSED' });
    expect(await cardCount('ana', deck.id)).toBe(2);
  });

  it('refuses the same key on another deck with IDEMPOTENCY_KEY_REUSED', async () => {
    const [spanish, french] = [await createDeck('ana'), await createDeck('ana')];
    await addCards('ana', spanish.id, KEY);

    const response = await addCards('ana', french.id, KEY);

    expect(response.json<ProblemDetails>().code).toBe('IDEMPOTENCY_KEY_REUSED');
    expect(await cardCount('ana', french.id)).toBe(0);
  });

  it('refuses an invalid key with VALIDATION_FAILED naming the header, before writing', async () => {
    const deck = await createDeck('ana');

    const response = await addCards('ana', deck.id, 'short');

    expect(response.statusCode).toBe(400);
    expect(response.json<ProblemDetails>()).toMatchObject({
      code: 'VALIDATION_FAILED',
      issues: [{ path: 'idempotency-key' }],
    });
    expect(await cardCount('ana', deck.id)).toBe(0);
  });

  it('does not keep a failed request: the corrected retry with the same key runs', async () => {
    const deck = await createDeck('ana');

    const refused = await addCards('ana', deck.id, KEY, [{ front: '<b>hola</b>', back: 'hi' }]);
    const corrected = await addCards('ana', deck.id, KEY);

    expect(refused.json<ProblemDetails>().code).toBe('VALIDATION_FAILED');
    expect(corrected.statusCode).toBe(201);
    expect(corrected.headers[IDEMPOTENT_REPLAYED_HEADER]).toBeUndefined();
    expect(await cardCount('ana', deck.id)).toBe(2);
  });

  it('never replays one user’s response to another using the same key', async () => {
    const anaDeck = await createDeck('ana');
    const benDeck = await createDeck('ben');
    await addCards('ana', anaDeck.id, KEY);

    const ben = await addCards('ben', benDeck.id, KEY);

    expect(ben.statusCode).toBe(201);
    expect(ben.headers[IDEMPOTENT_REPLAYED_HEADER]).toBeUndefined();
    expect(ben.json<CardList>().cards.every((card) => card.deckId === benDeck.id)).toBe(true);
  });

  it('does not let a key get past a deck that is not the caller’s', async () => {
    const deck = await createDeck('ana');

    const response = await addCards('ben', deck.id, KEY);

    expect(response.json<ProblemDetails>().code).toBe('DECK_NOT_FOUND');
    expect(await cardCount('ana', deck.id)).toBe(0);
  });

  // Whether a retry here overlaps the first request (409) or follows it (a
  // replay) depends on timing; the atomic claim itself is tested on the store.
  it('adds the cards once when retries arrive together', async () => {
    const deck = await createDeck('ana');

    const responses = await Promise.all([
      addCards('ana', deck.id, KEY),
      addCards('ana', deck.id, KEY),
      addCards('ana', deck.id, KEY),
    ]);

    for (const response of responses) expect([201, 409]).toContain(response.statusCode);
    expect(await cardCount('ana', deck.id)).toBe(2);
  });

  it('checks the token before the key: a request without one stays UNAUTHENTICATED', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/decks/${KEY}/cards/batch`,
      headers: { [IDEMPOTENCY_KEY_HEADER]: KEY },
      payload: { cards: CARDS },
    });

    expect(response.json<ProblemDetails>().code).toBe('UNAUTHENTICATED');
  });
});

describe('Idempotency-Key on the other writes', () => {
  it('creates one deck for a retried POST /decks', async () => {
    const create = (): ReturnType<NestFastifyApplication['inject']> =>
      app.inject({
        method: 'POST',
        url: '/decks',
        headers: { ...signedInAs('ana'), [IDEMPOTENCY_KEY_HEADER]: KEY },
        payload: { title: 'Biology' },
      });

    const [first, retry] = [await create(), await create()];

    expect([first.statusCode, retry.statusCode]).toEqual([201, 201]);
    expect(retry.json<Deck>().id).toBe(first.json<Deck>().id);
    const decks = await app.inject({ method: 'GET', url: '/decks', headers: signedInAs('ana') });
    expect(decks.json<{ decks: Deck[] }>().decks).toHaveLength(1);
  });

  it('creates one card for a retried POST /decks/:deckId/cards', async () => {
    const deck = await createDeck('ana');
    const create = (): ReturnType<NestFastifyApplication['inject']> =>
      app.inject({
        method: 'POST',
        url: `/decks/${deck.id}/cards`,
        headers: { ...signedInAs('ana'), [IDEMPOTENCY_KEY_HEADER]: KEY },
        payload: { front: 'hablar', back: 'to speak' },
      });

    await create();
    const retry = await create();

    expect(retry.headers[IDEMPOTENT_REPLAYED_HEADER]).toBe('true');
    expect(await cardCount('ana', deck.id)).toBe(1);
  });

  it('records one review for a retried POST /study/reviews, and undoes one for a retried undo', async () => {
    const deck = await createDeck('ana');
    await addCards('ana', deck.id, undefined, [CARDS[0]!]);
    const due = await app.inject({ method: 'GET', url: '/study/due', headers: signedInAs('ana') });
    const [card] = due.json<DueCards>().cards;
    const review = {
      deckId: deck.id,
      cardId: card!.cardId,
      direction: 'forward',
      rating: 'good',
    };
    const submit = (): ReturnType<NestFastifyApplication['inject']> =>
      app.inject({
        method: 'POST',
        url: '/study/reviews',
        headers: { ...signedInAs('ana'), [IDEMPOTENCY_KEY_HEADER]: 'review-key-0001' },
        payload: review,
      });
    const undo = (key: string): ReturnType<NestFastifyApplication['inject']> =>
      app.inject({
        method: 'POST',
        url: '/study/reviews/undo',
        headers: { ...signedInAs('ana'), [IDEMPOTENCY_KEY_HEADER]: key },
      });
    const reviewCount = async (): Promise<number> =>
      (
        await app.inject({ method: 'GET', url: '/study/stats', headers: signedInAs('ana') })
      ).json<StudyStats>().totalReviews;

    const [first, retry] = [await submit(), await submit()];
    expect(retry.json<ReviewResult>().reviewId).toBe(first.json<ReviewResult>().reviewId);
    expect(await reviewCount()).toBe(1);

    await app.inject({
      method: 'POST',
      url: '/study/reviews',
      headers: signedInAs('ana'),
      payload: { ...review, rating: 'easy' },
    });
    expect(await reviewCount()).toBe(2);
    const [undone, undoneAgain] = [await undo('undo-key-0001'), await undo('undo-key-0001')];

    expect([undone.statusCode, undoneAgain.statusCode]).toEqual([200, 200]);
    expect(undoneAgain.headers[IDEMPOTENT_REPLAYED_HEADER]).toBe('true');
    expect(await reviewCount()).toBe(1);
  });
});
