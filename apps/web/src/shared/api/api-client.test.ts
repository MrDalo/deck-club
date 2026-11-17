import { DeckListSchema, type ErrorCode, type ProblemDetails } from '@deck-club/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest, shouldRetry } from './api-client';

const problem = (status: number, code: ErrorCode): ProblemDetails => ({
  type: 'x',
  title: code,
  status,
  code,
  detail: 'Nope.',
  traceId: 't-1',
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiRequest', () => {
  it('calls the BFF path and parses the body', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(Response.json({ decks: [] })));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequest('/decks', DeckListSchema)).resolves.toEqual({ decks: [] });
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/decks', { method: 'GET' });
  });

  it('throws an ApiError carrying the problem details', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(Response.json(problem(404, 'DECK_NOT_FOUND'), { status: 404 }))),
    );

    await expect(apiRequest('/decks/x', DeckListSchema)).rejects.toMatchObject({
      problem: { code: 'DECK_NOT_FOUND', traceId: 't-1' },
    });
  });

  it('reports a network failure as UPSTREAM_UNAVAILABLE', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('offline'))),
    );

    await expect(apiRequest('/decks', DeckListSchema)).rejects.toMatchObject({
      problem: { code: 'UPSTREAM_UNAVAILABLE' },
    });
  });
});

describe('shouldRetry', () => {
  it('never retries a refusal', () => {
    expect(shouldRetry(0, new ApiError(problem(404, 'DECK_NOT_FOUND')))).toBe(false);
  });

  it('retries a server fault twice', () => {
    const error = new ApiError(problem(503, 'UPSTREAM_UNAVAILABLE'));

    expect([shouldRetry(0, error), shouldRetry(1, error), shouldRetry(2, error)]).toEqual([
      true,
      true,
      false,
    ]);
  });
});
