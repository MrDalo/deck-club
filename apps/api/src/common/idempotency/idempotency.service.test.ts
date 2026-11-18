import { Logger } from '@nestjs/common';
import { beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import { AppError } from '../errors/app-error.js';
import { IDEMPOTENCY_POLICY } from './idempotency-policy.js';
import { IdempotencyService, type IdempotentRequest } from './idempotency.service.js';
import { InMemoryIdempotencyStore } from './in-memory-idempotency.store.js';

const START = new Date('2026-11-17T10:00:00.000Z').getTime();

function createService(): {
  service: IdempotencyService;
  store: InMemoryIdempotencyStore;
  advance: (milliseconds: number) => void;
} {
  let now = START;
  let reservations = 0;
  const store = new InMemoryIdempotencyStore();
  const service = new IdempotencyService(store, {
    clock: { now: () => new Date(now) },
    ids: { next: () => `reservation-${(reservations += 1)}` },
  });
  return { service, store, advance: (milliseconds) => (now += milliseconds) };
}

const REQUEST: IdempotentRequest = { userId: 'ana', key: 'retry-key-0001', fingerprint: 'batch-a' };
const CREATED = { cards: [{ id: 'card-1', front: 'hablar' }] };

/** A write that counts how often it really ran. */
function countingWrite(body: unknown = CREATED): {
  write: () => Promise<unknown>;
  runs: () => number;
} {
  let runs = 0;
  return {
    write: () => {
      runs += 1;
      return Promise.resolve(body);
    },
    runs: () => runs,
  };
}

let log: MockInstance<Logger['log']>;

beforeEach(() => {
  log = vi.spyOn(Logger.prototype, 'log').mockReturnValue(undefined);
});

describe('IdempotencyService.run', () => {
  it('runs a first request and answers with its own response', async () => {
    const { service } = createService();
    const { write, runs } = countingWrite();

    await expect(service.run(REQUEST, write)).resolves.toEqual({ body: CREATED, replayed: false });
    expect(runs()).toBe(1);
  });

  it('replays the stored response to a retry without writing again', async () => {
    const { service } = createService();
    const { write, runs } = countingWrite();
    await service.run(REQUEST, write);

    const retry = await service.run(REQUEST, write);

    expect(retry).toEqual({ body: CREATED, replayed: true });
    expect(runs()).toBe(1);
  });

  it('records a replay by user only, never the key or the response', async () => {
    const { service } = createService();
    await service.run(REQUEST, () => Promise.resolve(CREATED));

    await service.run(REQUEST, () => Promise.resolve(CREATED));

    expect(log).toHaveBeenCalledWith({
      evt: 'idempotency.replayed',
      user: 'ana',
    });
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/hablar|retry-key/);
  });

  it('refuses the same key for a different request with IDEMPOTENCY_KEY_REUSED', async () => {
    const { service } = createService();
    const { write, runs } = countingWrite();
    await service.run(REQUEST, write);

    await expect(service.run({ ...REQUEST, fingerprint: 'batch-b' }, write)).rejects.toMatchObject({
      code: 'IDEMPOTENCY_KEY_REUSED',
    });
    expect(runs()).toBe(1);
  });

  it('refuses a retry while the first request still runs with IDEMPOTENCY_KEY_IN_USE', async () => {
    const { service } = createService();
    let finish: (body: unknown) => void = () => undefined;
    const first = service.run(REQUEST, () => new Promise((resolve) => (finish = resolve)));

    await expect(service.run(REQUEST, () => Promise.resolve(CREATED))).rejects.toMatchObject({
      code: 'IDEMPOTENCY_KEY_IN_USE',
    });
    finish(CREATED);
    await expect(first).resolves.toEqual({ body: CREATED, replayed: false });
  });

  it('releases the key when the write fails, so a retry runs again', async () => {
    const { service, store } = createService();
    const refusal = new AppError('DECK_NOT_FOUND', 'No deck with that id exists in your library.');

    await expect(service.run(REQUEST, () => Promise.reject(refusal))).rejects.toBe(refusal);
    expect(store.stored('ana', REQUEST.key)).toBeUndefined();

    const { write, runs } = countingWrite();
    await expect(service.run(REQUEST, write)).resolves.toMatchObject({ replayed: false });
    expect(runs()).toBe(1);
  });

  it('keeps keys apart per user: another user’s key never replays', async () => {
    const { service } = createService();
    await service.run(REQUEST, () => Promise.resolve(CREATED));
    const { write, runs } = countingWrite({ cards: [] });

    const ben = await service.run({ ...REQUEST, userId: 'ben' }, write);

    expect(ben).toEqual({ body: { cards: [] }, replayed: false });
    expect(runs()).toBe(1);
  });

  it('forgets a key after the retention period, so it runs as a new request', async () => {
    const { service, advance } = createService();
    const { write, runs } = countingWrite();
    await service.run(REQUEST, write);

    advance(IDEMPOTENCY_POLICY.retentionMs + 1);
    const later = await service.run({ ...REQUEST, fingerprint: 'batch-b' }, write);

    expect(later.replayed).toBe(false);
    expect(runs()).toBe(2);
  });

  it('still replays just inside the retention period', async () => {
    const { service, advance } = createService();
    const { write, runs } = countingWrite();
    await service.run(REQUEST, write);

    advance(IDEMPOTENCY_POLICY.retentionMs - 1);

    await expect(service.run(REQUEST, write)).resolves.toMatchObject({ replayed: true });
    expect(runs()).toBe(1);
  });

  it('takes over a key whose request never finished, once it counts as abandoned', async () => {
    const { service, advance } = createService();
    void service.run(REQUEST, () => new Promise(() => undefined));

    advance(IDEMPOTENCY_POLICY.abandonedAfterMs + 1);
    const { write, runs } = countingWrite();

    await expect(service.run(REQUEST, write)).resolves.toMatchObject({ replayed: false });
    expect(runs()).toBe(1);
  });

  it('answers with the write even when its response cannot be stored', async () => {
    const error = vi.spyOn(Logger.prototype, 'error').mockReturnValue(undefined);
    const { service, store } = createService();
    store.failCompletion = true;

    await expect(service.run(REQUEST, () => Promise.resolve(CREATED))).resolves.toEqual({
      body: CREATED,
      replayed: false,
    });
    expect(error).toHaveBeenCalledWith({
      evt: 'idempotency.complete_failed',
      user: 'ana',
      errorName: 'Error',
    });
  });

  it('replays the response as JSON, the way it was sent the first time', async () => {
    const { service } = createService();
    await service.run(REQUEST, () => Promise.resolve({ count: 1, skipped: undefined }));

    await expect(service.run(REQUEST, () => Promise.resolve(null))).resolves.toEqual({
      body: { count: 1 },
      replayed: true,
    });
  });
});
