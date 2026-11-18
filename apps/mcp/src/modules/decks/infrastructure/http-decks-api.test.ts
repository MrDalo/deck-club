import { describe, expect, it, vi } from 'vitest';
import type { FetchFunction } from '../../../common/http/fetch-function.js';
import { testCaller } from '../../../common/mcp/testing/mcp-test-client.js';
import { DeckClubApiClient } from '../../../infra/deck-club-api/deck-club-api-client.js';
import { testCard, testDeck } from '../testing/fake-decks-api.js';
import { HttpDecksApi } from './http-decks-api.js';

const DECK = testDeck({ id: '00000000-0000-4000-8000-000000000001', title: 'Spanish verbs' });

function apiAnswering(response: Response | Error): {
  decks: HttpDecksApi;
  fetchFunction: ReturnType<typeof vi.fn<FetchFunction>>;
} {
  const fetchFunction = vi.fn<FetchFunction>(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  );
  return {
    decks: new HttpDecksApi(new DeckClubApiClient('http://api:4000', fetchFunction)),
    fetchFunction,
  };
}

describe('HttpDecksApi.listDecks', () => {
  it('reads GET /decks with the caller’s token and the AI client’s name', async () => {
    const { decks, fetchFunction } = apiAnswering(Response.json({ decks: [DECK] }));

    await expect(decks.listDecks(testCaller())).resolves.toEqual([DECK]);
    const [url, init] = fetchFunction.mock.calls[0]!;
    expect([url.toString(), init.method]).toEqual(['http://api:4000/decks', 'GET']);
    expect(init.headers).toMatchObject({
      authorization: 'Bearer token-ana',
      'x-deck-club-client': 'Claude',
    });
  });

  it('relays the API’s refusal when it rejects the token', async () => {
    const problem = {
      type: 'about:blank',
      title: 'UNAUTHENTICATED',
      status: 401,
      code: 'UNAUTHENTICATED',
      detail: 'Your session has expired. Sign in again.',
      traceId: 'trace-1',
    };
    const { decks } = apiAnswering(Response.json(problem, { status: 401 }));

    await expect(decks.listDecks(testCaller())).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
      detail: 'Your session has expired. Sign in again.',
    });
  });

  it('reports the API as unavailable when it cannot be reached', async () => {
    const { decks } = apiAnswering(new TypeError('fetch failed'));

    await expect(decks.listDecks(testCaller())).rejects.toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
    });
  });

  it('reports INTERNAL when the answer breaks the deck contract', async () => {
    const { decks } = apiAnswering(Response.json({ decks: [{ id: 'not-a-uuid' }] }));

    await expect(decks.listDecks(testCaller())).rejects.toMatchObject({ code: 'INTERNAL' });
  });
});

describe('HttpDecksApi.getDeck and listCards', () => {
  const CARD = testCard({ id: '00000000-0000-4000-8000-000000000002', deckId: DECK.id });

  it('reads GET /decks/:deckId with the caller’s credentials', async () => {
    const { decks, fetchFunction } = apiAnswering(Response.json(DECK));

    await expect(decks.getDeck(testCaller(), DECK.id)).resolves.toEqual(DECK);
    const [url, init] = fetchFunction.mock.calls[0]!;
    expect(url.toString()).toBe(`http://api:4000/decks/${DECK.id}`);
    expect(init.headers).toMatchObject({ authorization: 'Bearer token-ana' });
  });

  it('reads GET /decks/:deckId/cards', async () => {
    const { decks, fetchFunction } = apiAnswering(Response.json({ cards: [CARD] }));

    await expect(decks.listCards(testCaller(), DECK.id)).resolves.toEqual([CARD]);
    expect(fetchFunction.mock.calls[0]![0].toString()).toBe(
      `http://api:4000/decks/${DECK.id}/cards`,
    );
  });

  it('encodes the id, so it can never change the path it calls', async () => {
    const { decks, fetchFunction } = apiAnswering(Response.json(DECK));

    await decks.getDeck(testCaller(), '../admin?x=1').catch(() => undefined);

    expect(fetchFunction.mock.calls[0]![0].pathname).toBe('/decks/..%2Fadmin%3Fx%3D1');
  });

  it('relays DECK_NOT_FOUND for a deck that is not the caller’s', async () => {
    const problem = {
      type: 'about:blank',
      title: 'DECK_NOT_FOUND',
      status: 404,
      code: 'DECK_NOT_FOUND',
      detail: 'No deck with that id exists in your library.',
      traceId: 'trace-2',
    };
    const { decks } = apiAnswering(Response.json(problem, { status: 404 }));

    await expect(decks.listCards(testCaller(), DECK.id)).rejects.toMatchObject({
      code: 'DECK_NOT_FOUND',
    });
  });
});

describe('HttpDecksApi.searchCards', () => {
  const RESULT = { hits: [], totalMatches: 0 };

  it('reads GET /cards/search with the words, the deck, the limit and the caller’s token', async () => {
    const { decks, fetchFunction } = apiAnswering(Response.json(RESULT));

    await expect(
      decks.searchCards(testCaller(), { q: 'hablar presente', deckId: DECK.id, limit: 5 }),
    ).resolves.toEqual(RESULT);
    const [url, init] = fetchFunction.mock.calls[0]!;
    expect(url.pathname).toBe('/cards/search');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      q: 'hablar presente',
      deckId: DECK.id,
      limit: '5',
    });
    expect(init.headers).toMatchObject({
      authorization: 'Bearer token-ana',
      'x-deck-club-client': 'Claude',
    });
  });

  it('leaves the deck out of the query when searching every deck', async () => {
    const { decks, fetchFunction } = apiAnswering(Response.json(RESULT));

    await decks.searchCards(testCaller(), { q: 'x', limit: 20 });

    expect(fetchFunction.mock.calls[0]![0].searchParams.has('deckId')).toBe(false);
  });

  it('relays the API’s validation refusal', async () => {
    const problem = {
      type: 'about:blank',
      title: 'VALIDATION_FAILED',
      status: 400,
      code: 'VALIDATION_FAILED',
      detail: 'The request body is invalid.',
      traceId: 'trace-3',
    };
    const { decks } = apiAnswering(Response.json(problem, { status: 400 }));

    await expect(decks.searchCards(testCaller(), { q: 'x', limit: 20 })).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
  });

  it('reports INTERNAL when the answer breaks the search contract', async () => {
    const { decks } = apiAnswering(Response.json({ hits: 'none' }));

    await expect(decks.searchCards(testCaller(), { q: 'x', limit: 20 })).rejects.toMatchObject({
      code: 'INTERNAL',
    });
  });
});

describe('HttpDecksApi.createDeck', () => {
  const INPUT = { title: 'Spanish verbs', description: '', language: 'es', tags: ['a1'] };

  it('posts the deck to /decks as JSON with the caller’s credentials', async () => {
    const { decks, fetchFunction } = apiAnswering(Response.json(DECK, { status: 201 }));

    await expect(decks.createDeck(testCaller(), INPUT)).resolves.toEqual(DECK);
    const [url, init] = fetchFunction.mock.calls[0]!;
    expect([url.toString(), init.method, init.body]).toEqual([
      'http://api:4000/decks',
      'POST',
      JSON.stringify(INPUT),
    ]);
    expect(init.headers).toMatchObject({
      authorization: 'Bearer token-ana',
      'x-deck-club-client': 'Claude',
      'content-type': 'application/json',
    });
  });

  it('relays the API’s field problems when it refuses the input', async () => {
    const problem = {
      type: 'about:blank',
      title: 'VALIDATION_FAILED',
      status: 400,
      code: 'VALIDATION_FAILED',
      detail: 'The request body is invalid.',
      traceId: 'trace-5',
      issues: [{ path: 'title', message: 'Too small: expected string to have >=1 characters' }],
    };
    const { decks } = apiAnswering(Response.json(problem, { status: 400 }));

    await expect(decks.createDeck(testCaller(), INPUT)).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
      issues: [{ path: 'title' }],
    });
  });

  it('reports the API as unavailable, so the AI does not assume the deck exists', async () => {
    const { decks } = apiAnswering(new TypeError('fetch failed'));

    await expect(decks.createDeck(testCaller(), INPUT)).rejects.toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
    });
  });
});
