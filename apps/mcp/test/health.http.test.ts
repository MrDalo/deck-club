import { HealthSchema, ReadinessSchema } from '@deck-club/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestServer, type TestServer } from './test-app.js';

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});

afterAll(async () => {
  await server.app.close();
});

const get = (path: string): Promise<Response> => fetch(new URL(path, server.origin));

describe('GET /health (liveness)', () => {
  it('reports the service and its version without authentication', async () => {
    const response = await get('/health');

    expect(response.status).toBe(200);
    expect(HealthSchema.parse(await response.json())).toEqual({
      status: 'ok',
      service: 'mcp',
      version: 'test',
    });
  });
});

describe('GET /health/ready (readiness)', () => {
  it('is ready when the core API and Supabase Auth answer', async () => {
    const response = await get('/health/ready');

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const report = ReadinessSchema.parse(await response.json());
    expect(report.status).toBe('ready');
    expect(report.checks.map((check) => [check.name, check.status]).sort()).toEqual([
      ['api', 'up'],
      ['supabase-auth', 'up'],
    ]);
  });

  it('answers 503 and names the dependency when the API is down', async () => {
    server.api.healthy = false;
    try {
      const response = await get('/health/ready');

      expect(response.status).toBe(503);
      const report = ReadinessSchema.parse(await response.json());
      expect(report.status).toBe('not_ready');
      expect(report.checks.find((check) => check.name === 'api')).toMatchObject({
        status: 'down',
        detail: 'Deck Club is not reachable right now. Try again in a minute.',
      });
    } finally {
      server.api.healthy = true;
    }
  });

  it('answers 503 when the Supabase authorization server is unreachable, while liveness stays up', async () => {
    server.authorizationServer.goOffline();

    const [ready, live] = await Promise.all([get('/health/ready'), get('/health')]);

    expect(ready.status).toBe(503);
    expect(ReadinessSchema.parse(await ready.json()).checks).toContainEqual(
      expect.objectContaining({ name: 'supabase-auth', status: 'down' }),
    );
    expect(live.status).toBe(200);
  });
});
