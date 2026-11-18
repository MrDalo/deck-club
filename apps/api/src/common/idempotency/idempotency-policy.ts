import { createHash } from 'node:crypto';
import { IDEMPOTENCY_KEY_HEADER, IdempotencyKeySchema } from '@deck-club/contracts';
import { AppError } from '../errors/app-error.js';

/**
 * How long keys live (product spec 9: "a retried call never creates
 * duplicate cards"). A key is remembered for a day, long enough for any
 * client's retries; a request that claimed a key and never finished (the
 * process died) gives it up after a minute, so a retry can run again.
 */
export const IDEMPOTENCY_POLICY = {
  retentionMs: 24 * 60 * 60 * 1000,
  abandonedAfterMs: 60 * 1000,
} as const;

/** What a claimed key remembers about the request that claimed it. */
export type HeldKey = {
  /** The claiming request's {@link fingerprintOf}. */
  fingerprint: string;
  /** `in_progress` while that request runs; `completed` once its response is stored. */
  state: 'in_progress' | 'completed';
  /** The stored response body as JSON, once completed. */
  responseBody: string | null;
};

/** What a request may do with a key someone already holds. */
export type HeldKeyDecision = 'replay' | 'reused' | 'in_use';

/** The parts of a request that make two requests "the same request". */
export type RequestIdentity = {
  method: string;
  /** The path and query string, e.g. `/decks/…/cards/batch`. */
  url: string;
  /** The parsed JSON body, or undefined. */
  body: unknown;
};

/**
 * A digest of the request a key was sent with, so a key reused for a
 * different request (another route, deck or set of cards) is told apart from
 * a genuine retry. The user is not part of it: keys are stored per user.
 * @param request - method, path and body
 * @returns a hex SHA-256 digest
 */
export function fingerprintOf(request: RequestIdentity): string {
  return createHash('sha256')
    .update(`${request.method.toUpperCase()} ${request.url}\n`)
    .update(JSON.stringify(request.body ?? null))
    .digest('hex');
}

/**
 * Decides what a request gets when its key is already held: the stored
 * response for the same request once it finished, a refusal while it still
 * runs, and a refusal for a different request.
 * @param held - the key as stored
 * @param fingerprint - the incoming request's fingerprint
 * @returns `replay`, `in_use` or `reused`
 */
export function decideHeldKey(held: HeldKey, fingerprint: string): HeldKeyDecision {
  if (held.fingerprint !== fingerprint) return 'reused';
  return held.state === 'completed' ? 'replay' : 'in_use';
}

/**
 * Reads the optional `Idempotency-Key` header.
 * @param raw - the header as Fastify parsed it
 * @returns the key, or null when the request has none
 * @throws AppError VALIDATION_FAILED when it is sent twice or is not a valid key
 */
export function parseIdempotencyKey(raw: string | string[] | undefined): string | null {
  if (raw === undefined) return null;
  const parsed = IdempotencyKeySchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  throw new AppError('VALIDATION_FAILED', 'The Idempotency-Key header is invalid.', [
    {
      path: IDEMPOTENCY_KEY_HEADER,
      message: Array.isArray(raw)
        ? 'Send one Idempotency-Key header, not several.'
        : 'Use 8 to 128 letters, digits, dashes and underscores, e.g. a UUID.',
    },
  ]);
}
