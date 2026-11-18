import { CardListSchema, DeckSchema, HealthSchema } from '@deck-club/contracts';
import { describe, expect, it, vi } from 'vitest';
import { DeckClubError } from '../../common/errors/deck-club-error.js';
import type { FetchFunction } from '../../common/http/fetch-function.js';
import { DeckClubApiClient, toApiError } from './deck-club-api-client.js';

const credentials = { accessToken: 'token-ana', clientName: 'Claude' };
const DECK = {
  id: '00000000-0000-4000-8000-000000000001',
  title: 'Spanish',
  description: '',
  language: 'es',
  tags: [],
  visibility: 'private',
  cardCount: 0,
  createdAt: '2026-11-17T10:00:00.000Z',
  updatedAt: '2026-11-17T10:00:00.000Z',
};

function clientAnswering(response: Response | Error): {
  client: DeckClubApiClient;
  fetchFunction: ReturnType<typeof vi.fn<FetchFunction>>;
} {
  const fetchFunction = vi.fn<FetchFunction>(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  );
  return { client: new DeckClubApiClient('http://api:4000', fetchFunction), fetchFunction };
}

describe('DeckClubApiClient', () => {
  it('sends the user’s token and the AI client’s name, and parses the contract', async () => {
    const { client, fetchFunction } = clientAnswering(Response.json(DECK));

    const deck = await client.send({
      method: 'GET',
      path: '/decks/x',
      schema: DeckSchema,
      credentials,
    });

    expect(deck.title).toBe('Spanish');
    const [url, init] = fetchFunction.mock.calls[0]!;
    expect(url.toString()).toBe('http://api:4000/decks/x');
    expect(init.headers).toMatchObject({
      authorization: 'Bearer token-ana',
      'x-deck-club-client': 'Claude',
    });
  });

  it('sends a JSON body and the query string', async () => {
    const { client, fetchFunction } = clientAnswering(Response.json({ cards: [] }));

    await client.send({
      method: 'POST',
      path: '/decks/x/cards/batch',
      schema: CardListSchema,
      query: { dryRun: 1, skipped: undefined },
      body: { cards: [] },
      credentials,
    });

    const [url, init] = fetchFunction.mock.calls[0]!;
    expect(url.toString()).toBe('http://api:4000/decks/x/cards/batch?dryRun=1');
    expect(init).toMatchObject({ method: 'POST', body: '{"cards":[]}' });
    expect(init.headers).toMatchObject({ 'content-type': 'application/json' });
  });

  it('sends no credentials to a public endpoint', async () => {
    const { client, fetchFunction } = clientAnswering(
      Response.json({ status: 'ok', service: 'api', version: 'dev' }),
    );

    await client.send({ method: 'GET', path: '/health', schema: HealthSchema });

    expect(fetchFunction.mock.calls[0]![1].headers).not.toHaveProperty('authorization');
  });

  it('relays the API’s refusal code and detail', async () => {
    const problem = {
      type: 'about:blank',
      title: 'DECK_NOT_FOUND',
      status: 404,
      code: 'DECK_NOT_FOUND',
      detail: 'No deck with that id exists in your library.',
      traceId: 'trace-1',
    };
    const { client } = clientAnswering(Response.json(problem, { status: 404 }));

    await expect(
      client.send({ method: 'GET', path: '/decks/x', schema: DeckSchema, credentials }),
    ).rejects.toMatchObject({ code: 'DECK_NOT_FOUND', detail: problem.detail });
  });

  it('reports UPSTREAM_UNAVAILABLE when the API cannot be reached', async () => {
    const { client } = clientAnswering(new TypeError('fetch failed'));

    await expect(
      client.send({ method: 'GET', path: '/health', schema: HealthSchema }),
    ).rejects.toMatchObject({ code: 'UPSTREAM_UNAVAILABLE' });
  });

  it('reports INTERNAL when a success breaks the contract', async () => {
    const { client } = clientAnswering(Response.json({ unexpected: true }));

    await expect(
      client.send({ method: 'GET', path: '/decks/x', schema: DeckSchema, credentials }),
    ).rejects.toMatchObject({ code: 'INTERNAL' });
  });

  it('gives up after the timeout instead of waiting forever', async () => {
    const fetchFunction = vi.fn<FetchFunction>(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('timeout', 'TimeoutError')),
          );
        }),
    );
    const client = new DeckClubApiClient('http://api:4000', fetchFunction);

    await expect(
      client.send({ method: 'GET', path: '/health', schema: HealthSchema, timeoutMs: 10 }),
    ).rejects.toMatchObject({ code: 'UPSTREAM_UNAVAILABLE' });
  });
});

describe('toApiError', () => {
  it('treats a 5xx without problem details as the API being unavailable', () => {
    expect(toApiError('<html>Bad gateway</html>', 502)).toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
    });
  });

  it('falls back to INTERNAL for a 4xx that is not problem details', () => {
    const error = toApiError(null, 418);

    expect(error).toBeInstanceOf(DeckClubError);
    expect(error.code).toBe('INTERNAL');
  });
});

describe('toApiError, field problems', () => {
  it('keeps the field problems of a VALIDATION_FAILED', () => {
    const problem = {
      type: 'about:blank',
      title: 'VALIDATION_FAILED',
      status: 400,
      code: 'VALIDATION_FAILED',
      detail: 'The request body is invalid.',
      traceId: 'trace-4',
      issues: [{ path: 'title', message: 'Too small' }],
    };

    expect(toApiError(problem, 400)).toMatchObject({
      code: 'VALIDATION_FAILED',
      issues: [{ path: 'title', message: 'Too small' }],
    });
  });

  it('has no field problems for other refusals', () => {
    const problem = {
      type: 'about:blank',
      title: 'DECK_NOT_FOUND',
      status: 404,
      code: 'DECK_NOT_FOUND',
      detail: 'Gone.',
      traceId: 't',
    };

    expect(toApiError(problem, 404).issues).toEqual([]);
  });
});
