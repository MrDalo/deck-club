import { describe, expect, it, vi } from 'vitest';
import type { FetchFunction } from '../../../common/http/fetch-function.js';
import { testCaller } from '../../../common/mcp/testing/mcp-test-client.js';
import { DeckClubApiClient } from '../../../infra/deck-club-api/deck-club-api-client.js';
import { STUDY_DECK_ID, testDueCard, testStudyDeck } from '../testing/fake-study-api.js';
import { HttpStudyApi } from './http-study-api.js';

const DUE = {
  cards: [testDueCard({ cardId: '00000000-0000-4000-8000-000000000001' })],
  totalDue: 12,
};

function apiAnswering(response: Response | Error): {
  study: HttpStudyApi;
  fetchFunction: ReturnType<typeof vi.fn<FetchFunction>>;
} {
  const fetchFunction = vi.fn<FetchFunction>(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  );
  return {
    study: new HttpStudyApi(new DeckClubApiClient('http://api:4000', fetchFunction)),
    fetchFunction,
  };
}

describe('HttpStudyApi.getDueCards', () => {
  it('reads GET /study/due for every deck with the caller’s token and the AI client’s name', async () => {
    const { study, fetchFunction } = apiAnswering(Response.json(DUE));

    await expect(study.getDueCards(testCaller(), { limit: 10 })).resolves.toEqual(DUE);
    const [url, init] = fetchFunction.mock.calls[0]!;
    expect([url.toString(), init.method]).toEqual(['http://api:4000/study/due?limit=10', 'GET']);
    expect(init.headers).toMatchObject({
      authorization: 'Bearer token-ana',
      'x-deck-club-client': 'Claude',
    });
  });

  it('limits the read to one deck', async () => {
    const { study, fetchFunction } = apiAnswering(Response.json(DUE));

    await study.getDueCards(testCaller(), { deckId: STUDY_DECK_ID, limit: 5 });

    const [url] = fetchFunction.mock.calls[0]!;
    expect(Object.fromEntries(url.searchParams)).toEqual({ deckId: STUDY_DECK_ID, limit: '5' });
  });

  it('relays the API’s DECK_NOT_FOUND for a deck that is not the caller’s', async () => {
    const problem = {
      type: 'about:blank',
      title: 'DECK_NOT_FOUND',
      status: 404,
      code: 'DECK_NOT_FOUND',
      detail: 'No deck with that id exists in your library.',
      traceId: 'trace-1',
    };
    const { study } = apiAnswering(Response.json(problem, { status: 404 }));

    await expect(
      study.getDueCards(testCaller(), { deckId: STUDY_DECK_ID, limit: 10 }),
    ).rejects.toMatchObject({
      code: 'DECK_NOT_FOUND',
      detail: 'No deck with that id exists in your library.',
    });
  });

  it('reports the API as unavailable when it cannot be reached', async () => {
    const { study } = apiAnswering(new TypeError('fetch failed'));

    await expect(study.getDueCards(testCaller(), { limit: 10 })).rejects.toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
    });
  });

  it('reports INTERNAL when the answer breaks the due cards contract', async () => {
    const { study } = apiAnswering(
      Response.json({ cards: [{ ...DUE.cards[0], state: 'mastered' }], totalDue: 1 }),
    );

    await expect(study.getDueCards(testCaller(), { limit: 10 })).rejects.toMatchObject({
      code: 'INTERNAL',
    });
  });
});

describe('HttpStudyApi.getDeck', () => {
  it('reads GET /decks/:deckId with the caller’s credentials', async () => {
    const deck = testStudyDeck();
    const { study, fetchFunction } = apiAnswering(Response.json(deck));

    await expect(study.getDeck(testCaller(), STUDY_DECK_ID)).resolves.toEqual(deck);
    const [url, init] = fetchFunction.mock.calls[0]!;
    expect(url.toString()).toBe(`http://api:4000/decks/${STUDY_DECK_ID}`);
    expect(init.headers).toMatchObject({ authorization: 'Bearer token-ana' });
  });
});

describe('HttpStudyApi.submitReview', () => {
  const REVIEW = {
    reviewId: '00000000-0000-4000-8000-000000000003',
    cardId: '00000000-0000-4000-8000-000000000001',
    direction: 'forward',
    rating: 'good',
    state: 'review',
    nextDueAt: '2026-11-20T10:00:00.000Z',
  };
  const COMMAND = {
    deckId: STUDY_DECK_ID,
    cardId: REVIEW.cardId,
    direction: 'forward' as const,
    rating: 'good' as const,
  };

  it('posts the review to /study/reviews as the caller, naming the AI client for provenance', async () => {
    const { study, fetchFunction } = apiAnswering(Response.json(REVIEW, { status: 201 }));

    await expect(study.submitReview(testCaller(), COMMAND, {})).resolves.toEqual({
      review: REVIEW,
      replayed: false,
    });
    const [url, init] = fetchFunction.mock.calls[0]!;
    expect([url.toString(), init.method]).toEqual(['http://api:4000/study/reviews', 'POST']);
    expect(JSON.parse(init.body as string)).toEqual(COMMAND);
    expect(init.headers).toMatchObject({
      authorization: 'Bearer token-ana',
      'x-deck-club-client': 'Claude',
    });
    expect(init.headers).not.toHaveProperty('idempotency-key');
  });

  it('sends the idempotency key as a header and reads a replay', async () => {
    const { study, fetchFunction } = apiAnswering(
      Response.json(REVIEW, { status: 201, headers: { 'idempotent-replayed': 'true' } }),
    );

    await expect(
      study.submitReview(testCaller(), COMMAND, { idempotencyKey: 'review-key-1' }),
    ).resolves.toMatchObject({ replayed: true });
    expect(fetchFunction.mock.calls[0]![1].headers).toMatchObject({
      'idempotency-key': 'review-key-1',
    });
  });

  it('relays DIRECTION_NOT_STUDIED for the reverse side of a basic card', async () => {
    const problem = {
      type: 'about:blank',
      title: 'DIRECTION_NOT_STUDIED',
      status: 422,
      code: 'DIRECTION_NOT_STUDIED',
      detail: 'Only reversible cards are studied in the reverse direction.',
      traceId: 'trace-1',
    };
    const { study } = apiAnswering(Response.json(problem, { status: 422 }));

    await expect(
      study.submitReview(testCaller(), { ...COMMAND, direction: 'reverse' }, {}),
    ).rejects.toMatchObject({ code: 'DIRECTION_NOT_STUDIED' });
  });

  it('reports INTERNAL when the answer breaks the review contract', async () => {
    const { study } = apiAnswering(Response.json({ ...REVIEW, state: 'mastered' }));

    await expect(study.submitReview(testCaller(), COMMAND, {})).rejects.toMatchObject({
      code: 'INTERNAL',
    });
  });
});

describe('HttpStudyApi.getStats and getToday', () => {
  const STATS = {
    streakDays: 4,
    reviewedToday: 12,
    totalReviews: 230,
    retention30d: 0.87,
    weakCards: [],
  };
  const TODAY = {
    decks: [{ deckId: STUDY_DECK_ID, title: 'Spanish verbs', dueReviews: 5, newCards: 3 }],
    totals: { dueReviews: 5, newCards: 3 },
    reviewedToday: 12,
    streakDays: 4,
  };

  it('reads GET /study/stats with the caller’s token', async () => {
    const { study, fetchFunction } = apiAnswering(Response.json(STATS));

    await expect(study.getStats(testCaller())).resolves.toEqual(STATS);
    const [url, init] = fetchFunction.mock.calls[0]!;
    expect([url.toString(), init.method]).toEqual(['http://api:4000/study/stats', 'GET']);
    expect(init.headers).toMatchObject({ authorization: 'Bearer token-ana' });
  });

  it('reads GET /study/today with the caller’s token', async () => {
    const { study, fetchFunction } = apiAnswering(Response.json(TODAY));

    await expect(study.getToday(testCaller())).resolves.toEqual(TODAY);
    expect(fetchFunction.mock.calls[0]![0].toString()).toBe('http://api:4000/study/today');
  });

  it('reports INTERNAL when the stats break the contract, e.g. an API without weak cards', async () => {
    const { weakCards: _weakCards, ...older } = STATS;
    const { study } = apiAnswering(Response.json(older));

    await expect(study.getStats(testCaller())).rejects.toMatchObject({ code: 'INTERNAL' });
  });
});
