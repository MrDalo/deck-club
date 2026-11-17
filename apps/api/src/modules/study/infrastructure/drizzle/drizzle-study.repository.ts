import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, gte, inArray, isNull } from 'drizzle-orm';
import { DATABASE, type Database } from '../../../../infra/database/database.js';
import type { StudyRepository } from '../../application/ports/study-repository.js';
import type { Review, StudyKey, StudyState } from '../../domain/study-state.js';
import { deserializeMemory, serializeMemory } from './memory-snapshot.js';
import { reviewsTable, studyStatesTable } from './study.schema.js';

type StateRow = typeof studyStatesTable.$inferSelect;
type ReviewRow = typeof reviewsTable.$inferSelect;

/** SQLite caps bound parameters per statement; card ids are read in chunks below it. */
const ID_CHUNK = 500;

const toState = (row: StateRow): StudyState => ({
  userId: row.userId,
  deckId: row.deckId,
  cardId: row.cardId,
  direction: row.direction,
  suspended: row.suspended,
  updatedAt: row.updatedAt,
  memory: {
    state: row.state,
    stability: row.stability,
    stabilityFast: row.stabilityFast,
    difficulty: row.difficulty,
    dueAt: row.dueAt,
    lastReviewAt: row.lastReviewAt,
    reps: row.reps,
    lapses: row.lapses,
    scheduledDays: row.scheduledDays,
    learningStep: row.learningStep,
  },
});

const toStateRow = ({ memory, ...state }: StudyState): StateRow => ({ ...state, ...memory });

const toReview = ({
  previousMemory,
  previousState: _previousState,
  ...row
}: ReviewRow): Review => ({
  ...row,
  previousMemory: previousMemory === null ? null : deserializeMemory(previousMemory),
});

const toReviewRow = (review: Review): ReviewRow => ({
  ...review,
  previousState: review.previousMemory?.state ?? null,
  previousMemory: review.previousMemory === null ? null : serializeMemory(review.previousMemory),
});

const stateKeyMatches = (userId: string, key: StudyKey) =>
  and(
    eq(studyStatesTable.userId, userId),
    eq(studyStatesTable.cardId, key.cardId),
    eq(studyStatesTable.direction, key.direction),
  );

/** Production adapter for {@link StudyRepository} on SQLite. Paired writes use one atomic batch. */
@Injectable()
export class DrizzleStudyRepository implements StudyRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async listStates(userId: string, cardIds: readonly string[]): Promise<StudyState[]> {
    const states: StudyState[] = [];
    for (let start = 0; start < cardIds.length; start += ID_CHUNK) {
      const chunk = cardIds.slice(start, start + ID_CHUNK);
      const rows = await this.database
        .select()
        .from(studyStatesTable)
        .where(and(eq(studyStatesTable.userId, userId), inArray(studyStatesTable.cardId, chunk)));
      states.push(...rows.map(toState));
    }
    return states;
  }

  async findState(userId: string, key: StudyKey): Promise<StudyState | null> {
    const [row] = await this.database
      .select()
      .from(studyStatesTable)
      .where(stateKeyMatches(userId, key));
    return row === undefined ? null : toState(row);
  }

  async recordReview(review: Review, nextState: StudyState): Promise<void> {
    const row = toStateRow(nextState);
    const { userId: _userId, cardId: _cardId, direction: _direction, ...changes } = row;
    await this.database.batch([
      this.database.insert(reviewsTable).values(toReviewRow(review)),
      this.database
        .insert(studyStatesTable)
        .values(row)
        .onConflictDoUpdate({
          target: [studyStatesTable.userId, studyStatesTable.cardId, studyStatesTable.direction],
          set: changes,
        }),
    ]);
  }

  async findLatestReview(userId: string): Promise<Review | null> {
    const [row] = await this.database
      .select()
      .from(reviewsTable)
      .where(and(eq(reviewsTable.userId, userId), isNull(reviewsTable.undoneAt)))
      .orderBy(desc(reviewsTable.reviewedAt), desc(reviewsTable.id))
      .limit(1);
    return row === undefined ? null : toReview(row);
  }

  async undoReview(review: Review, undoneAt: Date): Promise<void> {
    const markUndone = this.database
      .update(reviewsTable)
      .set({ undoneAt })
      .where(eq(reviewsTable.id, review.id));
    const key = { cardId: review.cardId, direction: review.direction };
    const previous = review.previousMemory;
    const restore =
      previous === null
        ? this.database.delete(studyStatesTable).where(stateKeyMatches(review.userId, key))
        : this.database
            .update(studyStatesTable)
            .set({ ...previous, updatedAt: undoneAt })
            .where(stateKeyMatches(review.userId, key));
    await this.database.batch([markUndone, restore]);
  }

  async listReviewsSince(userId: string, since: Date): Promise<Review[]> {
    const rows = await this.database
      .select()
      .from(reviewsTable)
      .where(
        and(
          eq(reviewsTable.userId, userId),
          gte(reviewsTable.reviewedAt, since),
          isNull(reviewsTable.undoneAt),
        ),
      )
      .orderBy(reviewsTable.reviewedAt);
    return rows.map(toReview);
  }

  async countReviews(userId: string): Promise<number> {
    const [row] = await this.database
      .select({ total: count() })
      .from(reviewsTable)
      .where(and(eq(reviewsTable.userId, userId), isNull(reviewsTable.undoneAt)));
    return row?.total ?? 0;
  }
}
