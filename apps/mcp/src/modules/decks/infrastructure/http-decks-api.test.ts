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

    await expect(decks.createDeck(testCaller(), INPUT)).resolves.toEqual({
      value: DECK,
      replayed: false,
    });
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
    expect(init.headers).not.toHaveProperty('idempotency-key');
  });

  it('sends the AI’s idempotency key and reports the API’s replay of the first deck', async () => {
    const { decks, fetchFunction } = apiAnswering(
      Response.json(DECK, { status: 201, headers: { 'idempotent-replayed': 'true' } }),
    );

    await expect(
      decks.createDeck(testCaller(), INPUT, { idempotencyKey: 'create-key-0001' }),
    ).resolves.toEqual({ value: DECK, replayed: true });
    expect(fetchFunction.mock.calls[0]![1].headers).toMatchObject({
      'idempotency-key': 'create-key-0001',
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

describe('HttpDecksApi.addCards', () => {
  const INPUT = {
    cards: [
      { type: 'reversible' as const, front: 'hablar', back: 'to speak', extra: '', tags: [] },
    ],
  };
  const CREATED = testCard({
    id: '00000000-0000-4000-8000-000000000003',
    deckId: DECK.id,
    type: 'reversible',
    front: 'hablar',
    back: 'to speak',
    provenance: { source: 'mcp', clientName: 'Claude' },
  });

  it('posts the batch to /decks/:deckId/cards/batch with the caller’s credentials', async () => {
    const { decks, fetchFunction } = apiAnswering(Response.json({ cards: [CREATED] }));

    await expect(decks.addCards(testCaller(), DECK.id, INPUT)).resolves.toEqual({
      value: [CREATED],
      replayed: false,
    });
    const [url, init] = fetchFunction.mock.calls[0]!;
    expect([url.toString(), init.method, init.body]).toEqual([
      `http://api:4000/decks/${DECK.id}/cards/batch`,
      'POST',
      JSON.stringify(INPUT),
    ]);
    expect(init.headers).toMatchObject({
      authorization: 'Bearer token-ana',
      'x-deck-club-client': 'Claude',
      'content-type': 'application/json',
    });
  });

  it('sends the AI’s idempotency key, and reports a replay of the cards already added', async () => {
    const { decks, fetchFunction } = apiAnswering(
      Response.json({ cards: [CREATED] }, { headers: { 'idempotent-replayed': 'true' } }),
    );

    await expect(
      decks.addCards(testCaller(), DECK.id, INPUT, { idempotencyKey: 'batch-key-0001' }),
    ).resolves.toEqual({ value: [CREATED], replayed: true });
    expect(fetchFunction.mock.calls[0]![1].headers).toMatchObject({
      'idempotency-key': 'batch-key-0001',
    });
  });

  it('relays the API’s refusal while an earlier call with the key still runs', async () => {
    const problem = {
      type: 'about:blank',
      title: 'IDEMPOTENCY_KEY_IN_USE',
      status: 409,
      code: 'IDEMPOTENCY_KEY_IN_USE',
      detail: 'A request with this Idempotency-Key is still running. Try again in a moment.',
      traceId: 'trace-8',
    };
    const { decks } = apiAnswering(Response.json(problem, { status: 409 }));

    await expect(
      decks.addCards(testCaller(), DECK.id, INPUT, { idempotencyKey: 'batch-key-0001' }),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_KEY_IN_USE' });
  });

  it('encodes the deck id, so it can never change the path it posts to', async () => {
    const { decks, fetchFunction } = apiAnswering(Response.json({ cards: [] }));

    await decks.addCards(testCaller(), '../admin', INPUT);

    expect(fetchFunction.mock.calls[0]![0].pathname).toBe('/decks/..%2Fadmin/cards/batch');
  });

  it('relays the API’s field problems when it refuses a card', async () => {
    const problem = {
      type: 'about:blank',
      title: 'VALIDATION_FAILED',
      status: 400,
      code: 'VALIDATION_FAILED',
      detail: 'The request body is invalid.',
      traceId: 'trace-6',
      issues: [
        { path: 'cards.0.front', message: 'Text must be plain: HTML tags are not allowed.' },
      ],
    };
    const { decks } = apiAnswering(Response.json(problem, { status: 400 }));

    await expect(decks.addCards(testCaller(), DECK.id, INPUT)).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
      issues: [{ path: 'cards.0.front' }],
    });
  });

  it('relays DECK_NOT_FOUND for a deck that is not the caller’s', async () => {
    const problem = {
      type: 'about:blank',
      title: 'DECK_NOT_FOUND',
      status: 404,
      code: 'DECK_NOT_FOUND',
      detail: 'No deck with that id exists in your library.',
      traceId: 'trace-7',
    };
    const { decks } = apiAnswering(Response.json(problem, { status: 404 }));

    await expect(decks.addCards(testCaller(), DECK.id, INPUT)).rejects.toMatchObject({
      code: 'DECK_NOT_FOUND',
    });
  });

  it('reports INTERNAL when the answer breaks the card contract', async () => {
    const { decks } = apiAnswering(Response.json({ cards: [{ id: 'not-a-card' }] }));

    await expect(decks.addCards(testCaller(), DECK.id, INPUT)).rejects.toMatchObject({
      code: 'INTERNAL',
    });
  });
});

describe('HttpDecksApi.updateCard', () => {
  const CARD_ID = '00000000-0000-4000-8000-000000000003';
  const UPDATED = testCard({ id: CARD_ID, deckId: DECK.id, front: 'hablar', back: 'to talk' });

  it('patches /decks/:deckId/cards/:cardId with only the changed fields', async () => {
    const { decks, fetchFunction } = apiAnswering(Response.json(UPDATED));

    await expect(
      decks.updateCard(testCaller(), { deckId: DECK.id, cardId: CARD_ID }, { back: 'to talk' }),
    ).resolves.toEqual(UPDATED);
    const [url, init] = fetchFunction.mock.calls[0]!;
    expect([url.toString(), init.method, init.body]).toEqual([
      `http://api:4000/decks/${DECK.id}/cards/${CARD_ID}`,
      'PATCH',
      '{"back":"to talk"}',
    ]);
    expect(init.headers).toMatchObject({
      authorization: 'Bearer token-ana',
      'x-deck-club-client': 'Claude',
    });
  });

  it('encodes both ids, so neither can change the path it patches', async () => {
    const { decks, fetchFunction } = apiAnswering(Response.json(UPDATED));

    await decks
      .updateCard(testCaller(), { deckId: '../x', cardId: '../../admin' }, { back: 'b' })
      .catch(() => undefined);

    expect(fetchFunction.mock.calls[0]![0].pathname).toBe('/decks/..%2Fx/cards/..%2F..%2Fadmin');
  });

  it('relays CARD_NOT_FOUND for a card that is not in the deck', async () => {
    const problem = {
      type: 'about:blank',
      title: 'CARD_NOT_FOUND',
      status: 404,
      code: 'CARD_NOT_FOUND',
      detail: 'No card with that id exists in this deck.',
      traceId: 'trace-10',
    };
    const { decks } = apiAnswering(Response.json(problem, { status: 404 }));

    await expect(
      decks.updateCard(testCaller(), { deckId: DECK.id, cardId: CARD_ID }, { back: 'b' }),
    ).rejects.toMatchObject({ code: 'CARD_NOT_FOUND' });
  });

  it('reports INTERNAL when the answer breaks the card contract', async () => {
    const { decks } = apiAnswering(Response.json({ id: CARD_ID }));

    await expect(
      decks.updateCard(testCaller(), { deckId: DECK.id, cardId: CARD_ID }, { back: 'b' }),
    ).rejects.toMatchObject({ code: 'INTERNAL' });
  });
});

describe('HttpDecksApi.deleteCard', () => {
  const CARD_ID = '00000000-0000-4000-8000-000000000003';

  it('sends DELETE /decks/:deckId/cards/:cardId with the caller’s credentials', async () => {
    const { decks, fetchFunction } = apiAnswering(new Response(null, { status: 204 }));

    await expect(
      decks.deleteCard(testCaller(), { deckId: DECK.id, cardId: CARD_ID }),
    ).resolves.toBeUndefined();
    const [url, init] = fetchFunction.mock.calls[0]!;
    expect([url.toString(), init.method, init.body]).toEqual([
      `http://api:4000/decks/${DECK.id}/cards/${CARD_ID}`,
      'DELETE',
      undefined,
    ]);
    expect(init.headers).toMatchObject({
      authorization: 'Bearer token-ana',
      'x-deck-club-client': 'Claude',
    });
  });

  it('encodes both ids, so neither can change the path it deletes', async () => {
    const { decks, fetchFunction } = apiAnswering(new Response(null, { status: 204 }));

    await decks.deleteCard(testCaller(), { deckId: '../x', cardId: '../../admin' });

    expect(fetchFunction.mock.calls[0]![0].pathname).toBe('/decks/..%2Fx/cards/..%2F..%2Fadmin');
  });

  it('relays CARD_NOT_FOUND for a card that is not in the deck', async () => {
    const problem = {
      type: 'about:blank',
      title: 'CARD_NOT_FOUND',
      status: 404,
      code: 'CARD_NOT_FOUND',
      detail: 'No card with that id exists in this deck.',
      traceId: 'trace-11',
    };
    const { decks } = apiAnswering(Response.json(problem, { status: 404 }));

    await expect(
      decks.deleteCard(testCaller(), { deckId: DECK.id, cardId: CARD_ID }),
    ).rejects.toMatchObject({ code: 'CARD_NOT_FOUND' });
  });

  it('reports the API as unavailable when it cannot be reached', async () => {
    const { decks } = apiAnswering(new TypeError('fetch failed'));

    await expect(
      decks.deleteCard(testCaller(), { deckId: DECK.id, cardId: CARD_ID }),
    ).rejects.toMatchObject({ code: 'UPSTREAM_UNAVAILABLE' });
  });
});
