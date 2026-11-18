import { Inject, Injectable } from '@nestjs/common';
import { and, eq, lt } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infra/database/database.js';
import type {
  ClaimResult,
  IdempotencyStore,
  KeyClaim,
  KeyReservation,
} from './idempotency-store.js';
import { idempotencyKeysTable as keys } from './idempotency.schema.js';

/** A claim races at most a release or a purge between its steps; past this, something is wrong. */
const MAX_CLAIM_ATTEMPTS = 3;

const sameKey = (reservation: Pick<KeyReservation, 'userId' | 'key'>) =>
  and(eq(keys.userId, reservation.userId), eq(keys.key, reservation.key));

const heldBy = (reservation: KeyReservation) =>
  and(sameKey(reservation), eq(keys.reservationId, reservation.reservationId));

/**
 * Production adapter for {@link IdempotencyStore} on SQLite. A claim is an
 * `INSERT … ON CONFLICT DO NOTHING` on the (user, key) primary key, so SQLite
 * decides which of two racing requests gets a key; taking over an abandoned
 * key is a conditional `UPDATE`, decided the same way.
 */
@Injectable()
export class DrizzleIdempotencyStore implements IdempotencyStore {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async claim(claim: KeyClaim): Promise<ClaimResult> {
    await this.database
      .delete(keys)
      .where(and(eq(keys.userId, claim.userId), lt(keys.createdAt, claim.expiredBefore)));
    for (let attempt = 0; attempt < MAX_CLAIM_ATTEMPTS; attempt += 1) {
      const fresh = {
        fingerprint: claim.fingerprint,
        reservationId: claim.reservationId,
        state: 'in_progress' as const,
        responseBody: null,
        createdAt: claim.now,
      };
      const inserted = await this.database
        .insert(keys)
        .values({ userId: claim.userId, key: claim.key, ...fresh })
        .onConflictDoNothing();
      if (inserted.rowsAffected === 1) return { outcome: 'claimed' };

      const takenOver = await this.database
        .update(keys)
        .set(fresh)
        .where(
          and(
            sameKey(claim),
            eq(keys.state, 'in_progress'),
            lt(keys.createdAt, claim.abandonedBefore),
          ),
        );
      if (takenOver.rowsAffected === 1) return { outcome: 'claimed' };

      const [row] = await this.database.select().from(keys).where(sameKey(claim));
      if (row !== undefined)
        return {
          outcome: 'held',
          held: { fingerprint: row.fingerprint, state: row.state, responseBody: row.responseBody },
        };
      // Released or purged between the insert and the read: try again.
    }
    throw new Error('Could not claim an idempotency key.');
  }

  async complete(reservation: KeyReservation, responseBody: string): Promise<void> {
    await this.database
      .update(keys)
      .set({ state: 'completed', responseBody })
      .where(heldBy(reservation));
  }

  async release(reservation: KeyReservation): Promise<void> {
    await this.database.delete(keys).where(and(heldBy(reservation), eq(keys.state, 'in_progress')));
  }
}
