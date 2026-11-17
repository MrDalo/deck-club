import type { SchedulingMemory } from '../../domain/study-state.js';

type SnapshotJson = Omit<SchedulingMemory, 'dueAt' | 'lastReviewAt'> & {
  dueAt: string;
  lastReviewAt: string | null;
};

/**
 * Serialises a memory for the review log's `previous_memory` column.
 * @param memory - the memory before a review
 * @returns JSON with ISO dates
 */
export function serializeMemory(memory: SchedulingMemory): string {
  const snapshot: SnapshotJson = {
    ...memory,
    dueAt: memory.dueAt.toISOString(),
    lastReviewAt: memory.lastReviewAt?.toISOString() ?? null,
  };
  return JSON.stringify(snapshot);
}

/**
 * Reads a snapshot written by {@link serializeMemory}. The column is written
 * only by this module, so the shape is trusted and only dates are revived.
 * @param json - the stored snapshot
 * @returns the memory with real Dates
 */
export function deserializeMemory(json: string): SchedulingMemory {
  const snapshot = JSON.parse(json) as SnapshotJson;
  return {
    ...snapshot,
    dueAt: new Date(snapshot.dueAt),
    lastReviewAt: snapshot.lastReviewAt === null ? null : new Date(snapshot.lastReviewAt),
  };
}
