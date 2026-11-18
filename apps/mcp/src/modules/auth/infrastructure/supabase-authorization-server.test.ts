import { describe, expect, it, vi } from 'vitest';
import type { FetchFunction } from '../../../common/http/fetch-function.js';
import {
  FAKE_AUTHORIZATION_SERVER_METADATA,
  FAKE_ISSUER,
} from '../testing/fake-authorization-server.js';
import {
  authorizationServerMetadataUrl,
  SupabaseAuthorizationServer,
} from './supabase-authorization-server.js';

function serverAnswering(...responses: (Response | Error)[]): {
  server: SupabaseAuthorizationServer;
  fetchFunction: ReturnType<typeof vi.fn<FetchFunction>>;
  clock: { now: number };
} {
  const clock = { now: 0 };
  const queue = [...responses];
  const fetchFunction = vi.fn<FetchFunction>(() => {
    const next = queue.shift() ?? new Error('no more responses');
    return next instanceof Error ? Promise.reject(next) : Promise.resolve(next);
  });
  const server = new SupabaseAuthorizationServer(FAKE_ISSUER, fetchFunction, () => clock.now);
  return { server, fetchFunction, clock };
}

describe('authorizationServerMetadataUrl', () => {
  it('inserts the well-known segment before the issuer path (RFC 8414 §3.1)', () => {
    expect(authorizationServerMetadataUrl('https://ref.supabase.co/auth/v1').href).toBe(
      'https://ref.supabase.co/.well-known/oauth-authorization-server/auth/v1',
    );
  });

  it('handles an issuer without a path', () => {
    expect(authorizationServerMetadataUrl('https://auth.example.com/').href).toBe(
      'https://auth.example.com/.well-known/oauth-authorization-server',
    );
  });
});

describe('SupabaseAuthorizationServer', () => {
  it('fetches the metadata from the issuer’s well-known URL', async () => {
    const { server, fetchFunction } = serverAnswering(
      Response.json(FAKE_AUTHORIZATION_SERVER_METADATA),
    );

    await expect(server.metadata()).resolves.toEqual(FAKE_AUTHORIZATION_SERVER_METADATA);
    expect(fetchFunction.mock.calls[0]![0].href).toBe(
      'https://test-project.supabase.co/.well-known/oauth-authorization-server/auth/v1',
    );
  });

  it('serves the cached document for ten minutes, then refetches', async () => {
    const { server, fetchFunction, clock } = serverAnswering(
      Response.json(FAKE_AUTHORIZATION_SERVER_METADATA),
      Response.json(FAKE_AUTHORIZATION_SERVER_METADATA),
    );

    await server.metadata();
    clock.now = 9 * 60 * 1000;
    await server.metadata();
    expect(fetchFunction).toHaveBeenCalledTimes(1);

    clock.now = 10 * 60 * 1000;
    await server.metadata();
    expect(fetchFunction).toHaveBeenCalledTimes(2);
  });

  it('shares one request between concurrent callers', async () => {
    const { server, fetchFunction } = serverAnswering(
      Response.json(FAKE_AUTHORIZATION_SERVER_METADATA),
    );

    await Promise.all([server.metadata(), server.metadata(), server.metadata()]);

    expect(fetchFunction).toHaveBeenCalledTimes(1);
  });

  it('says the OAuth server is not enabled when the metadata is missing', async () => {
    const { server } = serverAnswering(new Response('Not found', { status: 404 }));

    await expect(server.metadata()).rejects.toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
      detail: 'The Supabase OAuth 2.1 server is not enabled for this project.',
    });
  });

  it('refuses metadata that names another issuer (RFC 8414 §3.3)', async () => {
    const { server } = serverAnswering(
      Response.json({ ...FAKE_AUTHORIZATION_SERVER_METADATA, issuer: 'https://evil.example.com' }),
    );

    await expect(server.metadata()).rejects.toMatchObject({
      detail: expect.stringContaining('issuer') as string,
    });
  });

  it('refuses a document that is not authorization server metadata', async () => {
    const { server } = serverAnswering(Response.json({ hello: 'world' }));

    await expect(server.metadata()).rejects.toMatchObject({ code: 'UPSTREAM_UNAVAILABLE' });
  });

  it('reports Supabase as unreachable on a network error, and retries on the next call', async () => {
    const { server } = serverAnswering(
      new TypeError('fetch failed'),
      Response.json(FAKE_AUTHORIZATION_SERVER_METADATA),
    );

    await expect(server.metadata()).rejects.toMatchObject({
      detail: 'Supabase Auth is not reachable.',
    });
    await expect(server.metadata()).resolves.toEqual(FAKE_AUTHORIZATION_SERVER_METADATA);
  });

  it('reports a server error status', async () => {
    const { server } = serverAnswering(new Response('oops', { status: 500 }));

    await expect(server.metadata()).rejects.toMatchObject({
      detail: 'Supabase Auth answered 500.',
    });
  });
});
