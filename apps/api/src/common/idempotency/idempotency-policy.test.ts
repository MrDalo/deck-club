import { describe, expect, it } from 'vitest';
import {
  decideHeldKey,
  fingerprintOf,
  type HeldKey,
  parseIdempotencyKey,
} from './idempotency-policy.js';

const BATCH = {
  method: 'POST',
  url: '/decks/00000000-0000-4000-8000-000000000001/cards/batch',
  body: { cards: [{ front: 'hablar', back: 'to speak' }] },
};

describe('fingerprintOf', () => {
  it('is the same for the same request, so a retry is recognised', () => {
    expect(fingerprintOf(BATCH)).toBe(fingerprintOf(structuredClone(BATCH)));
    expect(fingerprintOf(BATCH)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('ignores the case of the method', () => {
    expect(fingerprintOf({ ...BATCH, method: 'post' })).toBe(fingerprintOf(BATCH));
  });

  it('differs for another body, route or method', () => {
    const original = fingerprintOf(BATCH);

    expect(
      fingerprintOf({ ...BATCH, body: { cards: [{ front: 'comer', back: 'to eat' }] } }),
    ).not.toBe(original);
    expect(fingerprintOf({ ...BATCH, url: '/decks' })).not.toBe(original);
    expect(fingerprintOf({ ...BATCH, method: 'PATCH' })).not.toBe(original);
  });

  it('treats a request without a body as a body of null', () => {
    expect(fingerprintOf({ method: 'POST', url: '/study/reviews/undo', body: undefined })).toBe(
      fingerprintOf({ method: 'POST', url: '/study/reviews/undo', body: null }),
    );
  });
});

describe('decideHeldKey', () => {
  const held = (overrides: Partial<HeldKey> = {}): HeldKey => ({
    fingerprint: 'same',
    state: 'completed',
    responseBody: '{"cards":[]}',
    ...overrides,
  });

  it('replays a finished request sent again', () => {
    expect(decideHeldKey(held(), 'same')).toBe('replay');
  });

  it('refuses a retry while the first request still runs', () => {
    expect(decideHeldKey(held({ state: 'in_progress', responseBody: null }), 'same')).toBe(
      'in_use',
    );
  });

  it('refuses a different request with the same key, finished or not', () => {
    expect(decideHeldKey(held(), 'other')).toBe('reused');
    expect(decideHeldKey(held({ state: 'in_progress' }), 'other')).toBe('reused');
  });
});

describe('parseIdempotencyKey', () => {
  it('is null when the request has no key: the header is optional', () => {
    expect(parseIdempotencyKey(undefined)).toBeNull();
  });

  it('accepts a UUID', () => {
    expect(parseIdempotencyKey('5f0c6f2e-8f7a-4a4b-9a43-3c4b2f1e0d9c')).toBe(
      '5f0c6f2e-8f7a-4a4b-9a43-3c4b2f1e0d9c',
    );
  });

  it('refuses a key too short to be unique, naming the header', () => {
    expect(() => parseIdempotencyKey('abc')).toThrow(
      expect.objectContaining({
        code: 'VALIDATION_FAILED',
        issues: [expect.objectContaining({ path: 'idempotency-key' })],
      }) as Error,
    );
  });

  it('refuses characters outside the safe set', () => {
    expect(() => parseIdempotencyKey('key with spaces')).toThrow(
      expect.objectContaining({ code: 'VALIDATION_FAILED' }) as Error,
    );
  });

  it('refuses the header sent twice', () => {
    expect(() => parseIdempotencyKey(['retry-key-0001', 'retry-key-0002'])).toThrow(
      expect.objectContaining({
        issues: [expect.objectContaining({ message: expect.stringContaining('one') as string })],
      }) as Error,
    );
  });
});
