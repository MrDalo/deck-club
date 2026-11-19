import { describe, expect, it, vi } from 'vitest';
import type { FetchFunction } from '../../../common/http/fetch-function.js';
import { testCaller } from '../../../common/mcp/testing/mcp-test-client.js';
import { DeckClubApiClient } from '../../../infra/deck-club-api/deck-club-api-client.js';
import { testClub } from '../testing/fake-clubs-api.js';
import { HttpClubsApi } from './http-clubs-api.js';

const CLUB = testClub({ id: '00000000-0000-4000-8000-0000000000c1', name: 'Spanish Fridays' });

function apiAnswering(response: Response | Error): {
  clubs: HttpClubsApi;
  fetchFunction: ReturnType<typeof vi.fn<FetchFunction>>;
} {
  const fetchFunction = vi.fn<FetchFunction>(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  );
  return {
    clubs: new HttpClubsApi(new DeckClubApiClient('http://api:4000', fetchFunction)),
    fetchFunction,
  };
}

describe('HttpClubsApi.listClubs', () => {
  it('reads GET /clubs with the caller’s token and the AI client’s name', async () => {
    const { clubs, fetchFunction } = apiAnswering(Response.json({ clubs: [CLUB] }));

    await expect(clubs.listClubs(testCaller())).resolves.toEqual([CLUB]);
    const [url, init] = fetchFunction.mock.calls[0]!;
    expect([url.toString(), init.method]).toEqual(['http://api:4000/clubs', 'GET']);
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
    const { clubs } = apiAnswering(Response.json(problem, { status: 401 }));

    await expect(clubs.listClubs(testCaller())).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
      detail: 'Your session has expired. Sign in again.',
    });
  });

  it('reports the API as unavailable when it cannot be reached', async () => {
    const { clubs } = apiAnswering(new TypeError('fetch failed'));

    await expect(clubs.listClubs(testCaller())).rejects.toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
    });
  });

  it('reports INTERNAL when the answer breaks the club contract', async () => {
    const { clubs } = apiAnswering(Response.json({ clubs: [{ ...CLUB, role: 'moderator' }] }));

    await expect(clubs.listClubs(testCaller())).rejects.toMatchObject({ code: 'INTERNAL' });
  });
});
