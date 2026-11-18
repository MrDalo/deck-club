import { describe, expect, it, vi } from 'vitest';
import type { FetchFunction } from '../../../common/http/fetch-function.js';
import { DeckClubApiClient } from '../../../infra/deck-club-api/deck-club-api-client.js';
import { ApiHealthProbe } from './api-health.probe.js';

function probeAnswering(response: Response | Error): {
  probe: ApiHealthProbe;
  fetchFunction: ReturnType<typeof vi.fn<FetchFunction>>;
} {
  const fetchFunction = vi.fn<FetchFunction>(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  );
  return {
    probe: new ApiHealthProbe(new DeckClubApiClient('http://api:4000', fetchFunction)),
    fetchFunction,
  };
}

describe('ApiHealthProbe', () => {
  it('passes when the API reports itself healthy', async () => {
    const { probe, fetchFunction } = probeAnswering(
      Response.json({ status: 'ok', service: 'api', version: 'dev' }),
    );

    await expect(probe.check()).resolves.toBeUndefined();
    expect(fetchFunction.mock.calls[0]![0].href).toBe('http://api:4000/health');
  });

  it('fails when the API cannot be reached', async () => {
    const { probe } = probeAnswering(new TypeError('fetch failed'));

    await expect(probe.check()).rejects.toMatchObject({ code: 'UPSTREAM_UNAVAILABLE' });
  });

  it('fails when something else answers on the API’s address', async () => {
    const { probe } = probeAnswering(Response.json({ hello: 'world' }));

    await expect(probe.check()).rejects.toMatchObject({ code: 'INTERNAL' });
  });
});
