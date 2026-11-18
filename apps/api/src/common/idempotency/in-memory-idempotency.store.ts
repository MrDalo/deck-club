import type { HeldKey } from './idempotency-policy.js';
import type {
  ClaimResult,
  IdempotencyStore,
  KeyClaim,
  KeyReservation,
} from './idempotency-store.js';

type StoredKey = HeldKey & { userId: string; reservationId: string; createdAt: Date };

const slot = (reservation: Pick<KeyReservation, 'userId' | 'key'>): string =>
  JSON.stringify([reservation.userId, reservation.key]);

/**
 * Test adapter for {@link IdempotencyStore}, with the same rules as the
 * SQLite one. Each call runs to completion before the next, which is the
 * atomicity SQLite gives the real adapter.
 */
export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly keys = new Map<string, StoredKey>();

  /** Makes every `complete` fail, e.g. the database going away after a write. */
  failCompletion = false;

  /** The key as stored, for assertions. */
  stored(userId: string, key: string): StoredKey | undefined {
    return this.keys.get(slot({ userId, key }));
  }

  claim(claim: KeyClaim): Promise<ClaimResult> {
    for (const [name, stored] of this.keys)
      if (stored.userId === claim.userId && stored.createdAt < claim.expiredBefore)
        this.keys.delete(name);
    const current = this.keys.get(slot(claim));
    const abandoned = current?.state === 'in_progress' && current.createdAt < claim.abandonedBefore;
    if (current !== undefined && !abandoned)
      return Promise.resolve({
        outcome: 'held',
        held: {
          fingerprint: current.fingerprint,
          state: current.state,
          responseBody: current.responseBody,
        },
      });
    this.keys.set(slot(claim), {
      userId: claim.userId,
      fingerprint: claim.fingerprint,
      reservationId: claim.reservationId,
      state: 'in_progress',
      responseBody: null,
      createdAt: claim.now,
    });
    return Promise.resolve({ outcome: 'claimed' });
  }

  complete(reservation: KeyReservation, responseBody: string): Promise<void> {
    if (this.failCompletion) return Promise.reject(new Error('database is gone'));
    const current = this.keys.get(slot(reservation));
    if (current?.reservationId === reservation.reservationId)
      this.keys.set(slot(reservation), { ...current, state: 'completed', responseBody });
    return Promise.resolve();
  }

  release(reservation: KeyReservation): Promise<void> {
    const current = this.keys.get(slot(reservation));
    if (current?.reservationId === reservation.reservationId && current.state === 'in_progress')
      this.keys.delete(slot(reservation));
    return Promise.resolve();
  }
}
