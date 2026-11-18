import { describe, expect, it } from 'vitest';
import { FakeAuthorizationServer } from '../testing/fake-authorization-server.js';
import { SupabaseAuthProbe } from './supabase-auth.probe.js';

describe('SupabaseAuthProbe', () => {
  it('passes while the authorization server publishes its metadata', async () => {
    const probe = new SupabaseAuthProbe(new FakeAuthorizationServer());

    await expect(probe.check()).resolves.toBeUndefined();
    expect(probe.name).toBe('supabase-auth');
  });

  it('fails with the reason when it does not', async () => {
    const server = new FakeAuthorizationServer();
    server.goOffline();

    await expect(new SupabaseAuthProbe(server).check()).rejects.toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
    });
  });
});
