import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppError } from '../errors/app-error.js';
import { TIME_AND_IDS, type TimeAndIds } from '../time-and-ids.js';
import { decideHeldKey, type HeldKey, IDEMPOTENCY_POLICY } from './idempotency-policy.js';
import {
  IDEMPOTENCY_STORE,
  type IdempotencyStore,
  type KeyReservation,
} from './idempotency-store.js';

/** A write sent with an idempotency key. */
export type IdempotentRequest = {
  userId: string;
  key: string;
  /** The request's `fingerprintOf`. */
  fingerprint: string;
};

/** What the write answers: its own response, or the stored one of the first request. */
export type IdempotentOutcome = {
  body: unknown;
  replayed: boolean;
};

/**
 * Runs a write at most once per user and key (product spec 9: writes accept
 * an idempotency key, so a retried call never creates duplicates). The first
 * request claims the key, runs, and stores its response; a retry of the same
 * request gets that response back without running. Failures are not stored:
 * the key is released, so the client can retry or correct its request.
 */
@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger('idempotency');

  constructor(
    @Inject(IDEMPOTENCY_STORE) private readonly store: IdempotencyStore,
    @Inject(TIME_AND_IDS) private readonly runtime: TimeAndIds,
  ) {}

  /**
   * @param request - the user, the key and the request's fingerprint
   * @param write - the write itself, run only when this request claims the key
   * @returns the write's response, or the first request's stored response
   * @throws AppError IDEMPOTENCY_KEY_REUSED for a key used with a different request, IDEMPOTENCY_KEY_IN_USE while the first request still runs, or whatever the write throws
   */
  async run(request: IdempotentRequest, write: () => Promise<unknown>): Promise<IdempotentOutcome> {
    const now = this.runtime.clock.now();
    const reservation: KeyReservation = {
      userId: request.userId,
      key: request.key,
      reservationId: this.runtime.ids.next(),
    };
    const claim = await this.store.claim({
      ...reservation,
      fingerprint: request.fingerprint,
      now,
      expiredBefore: new Date(now.getTime() - IDEMPOTENCY_POLICY.retentionMs),
      abandonedBefore: new Date(now.getTime() - IDEMPOTENCY_POLICY.abandonedAfterMs),
    });
    if (claim.outcome === 'held') return this.answerHeld(claim.held, request);

    let body: unknown;
    try {
      body = await write();
    } catch (error) {
      await this.store.release(reservation).catch((releaseError: unknown) => {
        this.logFailure('idempotency.release_failed', request, releaseError);
      });
      throw error;
    }
    // The write happened: answer with it even if the response cannot be stored.
    await this.store.complete(reservation, JSON.stringify(body ?? null)).catch((error: unknown) => {
      this.logFailure('idempotency.complete_failed', request, error);
    });
    return { body, replayed: false };
  }

  private answerHeld(held: HeldKey, request: IdempotentRequest): IdempotentOutcome {
    const decision = decideHeldKey(held, request.fingerprint);
    if (decision === 'reused')
      throw new AppError(
        'IDEMPOTENCY_KEY_REUSED',
        'This Idempotency-Key was already used for a different request. Use a new key for a new request.',
      );
    if (decision === 'in_use')
      throw new AppError(
        'IDEMPOTENCY_KEY_IN_USE',
        'A request with this Idempotency-Key is still running. Try again in a moment.',
      );
    this.logger.log({ evt: 'idempotency.replayed', user: request.userId });
    return { body: JSON.parse(held.responseBody ?? 'null') as unknown, replayed: true };
  }

  private logFailure(evt: string, request: IdempotentRequest, error: unknown): void {
    this.logger.error({
      evt,
      user: request.userId,
      errorName: error instanceof Error ? error.name : typeof error,
    });
  }
}
