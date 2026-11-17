import { CLIENT_NAME_HEADER } from '@deck-club/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpDeckClubApi, toApiError } from './http-deck-club-api.js';

const caller = { accessToken: 'jwt-token', clientName: 'Claude' };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('HttpDeckClubApi', () => {
  it('forwards the user token and the AI client name to the core API', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(Response.json({ decks: [] })));
    vi.stubGlobal('fetch', fetchMock);

    await new HttpDeckClubApi('http://api:4000').listDecks(caller);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.toString()).toBe('http://api:4000/decks');
    expect(init.headers).toMatchObject({
      authorization: 'Bearer jwt-token',
      [CLIENT_NAME_HEADER]: 'Claude',
    });
  });

  it('turns a problem-details response into an ApiRequestError with its code', async () => {
    const problem = {
      type: 'x',
      title: 'DECK_NOT_FOUND',
      status: 404,
      code: 'DECK_NOT_FOUND',
      detail: 'Gone.',
      traceId: 't',
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(Response.json(problem, { status: 404 }))),
    );

    await expect(
      new HttpDeckClubApi('http://api:4000').getDeck(caller, 'id'),
    ).rejects.toMatchObject({ code: 'DECK_NOT_FOUND' });
  });

  it('reports UPSTREAM_UNAVAILABLE when the API cannot be reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('fetch failed'))),
    );

    await expect(new HttpDeckClubApi('http://api:4000').listDecks(caller)).rejects.toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
    });
  });

  it('rejects a success response that does not match the contract', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(Response.json({ unexpected: true }))),
    );

    await expect(new HttpDeckClubApi('http://api:4000').listDecks(caller)).rejects.toMatchObject({
      code: 'INTERNAL',
    });
  });
});

describe('toApiError', () => {
  it('falls back to INTERNAL for a body that is not problem details', () => {
    expect(toApiError('<html>').code).toBe('INTERNAL');
  });
});
