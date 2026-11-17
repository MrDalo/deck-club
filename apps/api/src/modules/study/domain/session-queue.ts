import type { StudyDirection } from '@deck-club/contracts';
import type { StudyDay } from './study-day.js';
import {
  type Review,
  type SchedulingMemory,
  type StudyCard,
  type StudyState,
  studiedDirections,
  studyKeyOf,
} from './study-state.js';

/** Learning cards due within this window are shown once nothing else is left. */
const LEARN_AHEAD_MS = 20 * 60 * 1000;

/** Why a card side is in the queue, in session order (spec 6). */
const QUEUE_BUCKETS = ['learning', 'review', 'new', 'learnAhead'] as const;
type QueueBucket = (typeof QUEUE_BUCKETS)[number];

/** One card side to study now. `memory` is null for a card never reviewed. */
export type QueueEntry = {
  card: StudyCard;
  direction: StudyDirection;
  memory: SchedulingMemory | null;
  bucket: QueueBucket;
};

/** Per-deck daily limits (spec 6). */
type DailyLimits = {
  newCardsPerDeck: number;
  reviewsPerDeck: number;
};

/** Everything the queue needs; pure data, no I/O. */
export type QueueInput = {
  cards: readonly StudyCard[];
  states: readonly StudyState[];
  /** Today's reviews (not undone), to apply limits and the sibling rule. */
  reviewsToday: readonly Review[];
  now: Date;
  today: StudyDay;
  limits: DailyLimits;
};

type Candidate = QueueEntry & { sortKey: number };

const isFirstReview = (review: Review): boolean =>
  review.previousMemory === null || review.previousMemory.state === 'new';

function countByDeck(
  reviews: readonly Review[],
  predicate: (review: Review) => boolean,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const review of reviews.filter(predicate)) {
    counts.set(review.deckId, (counts.get(review.deckId) ?? 0) + 1);
  }
  return counts;
}

function classify(memory: SchedulingMemory | null, input: QueueInput): QueueBucket | null {
  if (memory === null || memory.state === 'new') return 'new';
  const dueMs = memory.dueAt.getTime();
  const isLearning = memory.state === 'learning' || memory.state === 'relearning';
  if (isLearning && dueMs <= input.now.getTime()) return 'learning';
  if (isLearning && dueMs <= input.now.getTime() + LEARN_AHEAD_MS) return 'learnAhead';
  if (!isLearning && dueMs < input.today.end.getTime()) return 'review';
  return null;
}

function collectCandidates(input: QueueInput): Candidate[] {
  const states = new Map(input.states.map((state) => [studyKeyOf(state), state]));
  const reviewedTodayKeys = new Set(input.reviewsToday.map((review) => studyKeyOf(review)));
  const candidates: Candidate[] = [];
  for (const card of input.cards) {
    for (const direction of studiedDirections(card.cardType)) {
      const sibling: StudyDirection = direction === 'forward' ? 'reverse' : 'forward';
      // Spec 6: the two directions of a reversible card are never shown on the same day.
      if (reviewedTodayKeys.has(studyKeyOf({ cardId: card.cardId, direction: sibling }))) continue;
      const state = states.get(studyKeyOf({ cardId: card.cardId, direction }));
      if (state?.suspended === true) continue;
      const memory = state?.memory ?? null;
      const bucket = classify(memory, input);
      if (bucket === null) continue;
      const sortKey = bucket === 'new' ? card.createdAt.getTime() : (memory?.dueAt.getTime() ?? 0);
      candidates.push({ card, direction, memory, bucket, sortKey });
    }
  }
  return candidates;
}

function applyLimits(sorted: readonly Candidate[], input: QueueInput): QueueEntry[] {
  const newDone = countByDeck(input.reviewsToday, isFirstReview);
  const reviewsDone = countByDeck(input.reviewsToday, (review) => !isFirstReview(review));
  const queuedCards = new Set<string>();
  const queue: QueueEntry[] = [];
  for (const { sortKey: _sortKey, ...entry } of sorted) {
    const deckId = entry.card.deckId;
    // One side of a card per day: a new reversible card enters with its forward side only.
    if (queuedCards.has(entry.card.cardId)) continue;
    if (entry.bucket === 'new') {
      if ((newDone.get(deckId) ?? 0) >= input.limits.newCardsPerDeck) continue;
      newDone.set(deckId, (newDone.get(deckId) ?? 0) + 1);
    }
    if (entry.bucket === 'review') {
      if ((reviewsDone.get(deckId) ?? 0) >= input.limits.reviewsPerDeck) continue;
      reviewsDone.set(deckId, (reviewsDone.get(deckId) ?? 0) + 1);
    }
    queuedCards.add(entry.card.cardId);
    queue.push(entry);
  }
  return queue;
}

/**
 * Builds today's session in spec 6 order: learning cards whose step is due,
 * then due reviews (most overdue first), then new cards up to the daily
 * limit in the order they were added, then learning cards due within the
 * next 20 minutes. Applies per-deck daily limits and the sibling rule.
 * @param input - cards, schedules, today's reviews, the time and limits
 * @returns the queue, first card first
 */
export function buildSessionQueue(input: QueueInput): QueueEntry[] {
  const sorted = collectCandidates(input).sort((first, second) => {
    const bucketOrder = QUEUE_BUCKETS.indexOf(first.bucket) - QUEUE_BUCKETS.indexOf(second.bucket);
    if (bucketOrder !== 0) return bucketOrder;
    if (first.sortKey !== second.sortKey) return first.sortKey - second.sortKey;
    return first.direction.localeCompare(second.direction);
  });
  return applyLimits(sorted, input);
}
