import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { type Database, openDatabase } from '../../infra/database/database.js';
import { DrizzleIdempotencyStore } from './drizzle-idempotency.store.js';
import type { KeyClaim } from './idempotency-store.js';
import { idempotencyKeysTable } from './idempotency.schema.js';

const NOW = new Date('2026-11-18T10:00:00.000Z');
const minutesAgo = (minutes: number): Date => new Date(NOW.getTime() - minutes * 60_000);

/** A claim made now that forgets keys older than a day and takes over ones idle for a minute. */
const claim = (overrides: Partial<KeyClaim> = {}): KeyClaim => ({
  userId: 'ana',
  key: 'retry-key-0001',
  reservationId: 'reservation-1',
  fingerprint: 'batch-a',
  now: NOW,
  expiredBefore: minutesAgo(24 * 60),
  abandonedBefore: minutesAgo(1),
  ...overrides,
});

let database: Database;
let store: DrizzleIdempotencyStore;

beforeEach(async () => {
  database = await openDatabase(':memory:');
  store = new DrizzleIdempotencyStore(database);
});

describe('DrizzleIdempotencyStore, on real SQLite', () => {
  it('claims a new key, then reports it held while its request runs', async () => {
    await expect(store.claim(claim())).resolves.toEqual({ outcome: 'claimed' });

    await expect(store.claim(claim({ reservationId: 'reservation-2' }))).resolves.toEqual({
      outcome: 'held',
      held: { fingerprint: 'batch-a', state: 'in_progress', responseBody: null },
    });
  });

  it('gives exactly one of two racing requests the key', async () => {
    const results = await Promise.all([
      store.claim(claim({ reservationId: 'reservation-1' })),
      store.claim(claim({ reservationId: 'reservation-2' })),
    ]);

    expect(results.map((result) => result.outcome).sort()).toEqual(['claimed', 'held']);
  });

  it('stores the response of the request that holds the key', async () => {
    await store.claim(claim());

    await store.complete(claim(), '{"cards":[]}');

    await expect(store.claim(claim({ reservationId: 'reservation-2' }))).resolves.toEqual({
      outcome: 'held',
      held: { fingerprint: 'batch-a', state: 'completed', responseBody: '{"cards":[]}' },
    });
  });

  it('lets only the holder complete or release the key', async () => {
    await store.claim(claim());
    const stranger = { userId: 'ana', key: 'retry-key-0001', reservationId: 'someone-else' };

    await store.complete(stranger, '{"forged":true}');
    await store.release(stranger);

    await expect(store.claim(claim({ reservationId: 'reservation-2' }))).resolves.toMatchObject({
      held: { state: 'in_progress', responseBody: null },
    });
  });

  it('frees a released key for the next request', async () => {
    await store.claim(claim());

    await store.release(claim());

    await expect(store.claim(claim({ reservationId: 'reservation-2' }))).resolves.toEqual({
      outcome: 'claimed',
    });
  });

  it('never releases a completed key, so its response keeps being replayed', async () => {
    await store.claim(claim());
    await store.complete(claim(), '{}');

    await store.release(claim());

    await expect(store.claim(claim({ reservationId: 'reservation-2' }))).resolves.toMatchObject({
      outcome: 'held',
    });
  });

  it('keeps the same key apart for two users', async () => {
    await store.claim(claim());

    await expect(store.claim(claim({ userId: 'ben' }))).resolves.toEqual({ outcome: 'claimed' });
  });

  it('takes over a key whose request was abandoned, and not a fresh one', async () => {
    await store.claim(claim({ now: minutesAgo(2) }));
    await store.claim(claim({ key: 'fresh-key-0001' }));

    await expect(store.claim(claim({ reservationId: 'reservation-2' }))).resolves.toEqual({
      outcome: 'claimed',
    });
    await expect(
      store.claim(claim({ key: 'fresh-key-0001', reservationId: 'reservation-3' })),
    ).resolves.toMatchObject({ outcome: 'held' });
  });

  it('never takes over a completed key, however old, until it expires', async () => {
    await store.claim(claim({ now: minutesAgo(60) }));
    await store.complete(claim(), '{}');

    await expect(store.claim(claim({ reservationId: 'reservation-2' }))).resolves.toMatchObject({
      outcome: 'held',
      held: { state: 'completed' },
    });
  });

  it('forgets the user’s expired keys, and only theirs', async () => {
    const yesterday = minutesAgo(24 * 60 + 1);
    await store.claim(claim({ now: yesterday }));
    await store.complete(claim(), '{}');
    await store.claim(claim({ userId: 'ben', now: yesterday }));

    await expect(
      store.claim(claim({ reservationId: 'reservation-2', fingerprint: 'batch-b' })),
    ).resolves.toEqual({ outcome: 'claimed' });
    const bens = await database
      .select()
      .from(idempotencyKeysTable)
      .where(eq(idempotencyKeysTable.userId, 'ben'));
    expect(bens).toHaveLength(1);
  });
});
