import { describe, expect, it } from 'vitest';
import { DeckClubError } from '../../../common/errors/deck-club-error.js';
import type { HealthProbe } from '../../../common/health/health-probe.js';
import { ReadinessService } from './readiness.service.js';

const IDENTITY = { service: 'mcp', version: 'abc123' };

const probe = (name: string, check: () => Promise<void>): HealthProbe => ({ name, check });
const passing = (name: string): HealthProbe => probe(name, () => Promise.resolve());

function service(probes: HealthProbe[], timeoutMs = 50): ReadinessService {
  let tick = 0;
  const clock = (): number => (tick += 7);
  return new ReadinessService({ list: () => probes }, IDENTITY, clock, timeoutMs);
}

describe('ReadinessService', () => {
  it('is ready when every dependency answers', async () => {
    const report = await service([passing('api'), passing('supabase-auth')]).report();

    expect(report).toMatchObject({
      status: 'ready',
      service: 'mcp',
      version: 'abc123',
      checks: [
        { name: 'api', status: 'up' },
        { name: 'supabase-auth', status: 'up' },
      ],
    });
  });

  it('measures how long each check took', async () => {
    const report = await service([passing('api')]).report();

    expect(report.checks[0]?.latencyMs).toBe(7);
  });

  it('is not ready when one dependency fails, and says why', async () => {
    const failing = probe('supabase-auth', () =>
      Promise.reject(
        new DeckClubError('UPSTREAM_UNAVAILABLE', 'The Supabase OAuth 2.1 server is not enabled.'),
      ),
    );

    const report = await service([passing('api'), failing]).report();

    expect(report.status).toBe('not_ready');
    expect(report.checks[1]).toMatchObject({
      status: 'down',
      detail: 'The Supabase OAuth 2.1 server is not enabled.',
    });
  });

  it('counts a dependency that does not answer in time as down', async () => {
    const hanging = probe('api', () => new Promise(() => undefined));

    const report = await service([hanging], 5).report();

    expect(report.checks[0]).toMatchObject({ name: 'api', status: 'down', detail: 'timed out' });
  });

  it('never publishes the message of an unexpected error', async () => {
    const leaking = probe('api', () =>
      Promise.reject(new Error('connect ECONNREFUSED 10.0.0.7:4000')),
    );

    const report = await service([leaking]).report();

    expect(report.checks[0]?.detail).toBe('check failed');
  });

  it('is ready with nothing to check', async () => {
    await expect(service([]).report()).resolves.toMatchObject({ status: 'ready', checks: [] });
  });
});
