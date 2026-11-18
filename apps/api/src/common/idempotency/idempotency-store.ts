import type { HeldKey } from './idempotency-policy.js';

/** One request's hold on a key: the user's key, and which request holds it. */
export type KeyReservation = {
  userId: string;
  key: string;
  /** Unique per claim, so only the request that claimed a key completes or releases it. */
  reservationId: string;
};

/** A request asking for a key. The cut-offs come from the policy, not the adapter. */
export type KeyClaim = KeyReservation & {
  fingerprint: string;
  now: Date;
  /** Keys claimed before this are forgotten: the request runs as new. */
  expiredBefore: Date;
  /** A key still in progress since before this was abandoned: the request takes it over. */
  abandonedBefore: Date;
};

/** The answer to a claim: the key is this request's now, or someone holds it. */
export type ClaimResult = { outcome: 'claimed' } | { outcome: 'held'; held: HeldKey };

/**
 * Port: where idempotency keys are kept. Claiming must be atomic, so of two
 * requests racing for one key exactly one gets it.
 */
export type IdempotencyStore = {
  /**
   * Claims the key for this request, forgetting the user's expired keys and
   * taking over an abandoned one; otherwise reports who holds it.
   */
  claim(claim: KeyClaim): Promise<ClaimResult>;
  /** Stores the response of the request that holds the key. */
  complete(reservation: KeyReservation, responseBody: string): Promise<void>;
  /** Gives the key up after the request failed, so a retry runs again. */
  release(reservation: KeyReservation): Promise<void>;
};

/** Nest injection token for {@link IdempotencyStore}. */
export const IDEMPOTENCY_STORE = Symbol('IDEMPOTENCY_STORE');
