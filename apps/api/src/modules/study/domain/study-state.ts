import type {
  CardType,
  Rating,
  ReviewSource,
  StudyDirection,
  StudyStateName,
} from '@deck-club/contracts';

/**
 * The FSRS memory of one card side for one user: what the scheduler needs to
 * compute the next review. Mirrors the scheduler's card fields one to one so
 * a state round-trips through the database without loss.
 */
export type SchedulingMemory = {
  state: StudyStateName;
  stability: number;
  stabilityFast: number;
  difficulty: number;
  dueAt: Date;
  lastReviewAt: Date | null;
  reps: number;
  lapses: number;
  scheduledDays: number;
  learningStep: number;
};

/** Identifies one schedule: a card side for a user. */
export type StudyKey = {
  cardId: string;
  direction: StudyDirection;
};

/** One user's schedule for one card side (spec 3, "Study state"). */
export type StudyState = StudyKey & {
  userId: string;
  deckId: string;
  memory: SchedulingMemory;
  /** Hidden from sessions while true (spec 6). */
  suspended: boolean;
  updatedAt: Date;
};

/** One rating of one card side. Append-only; undo marks it, never deletes it (spec 3, 6). */
export type Review = StudyKey & {
  id: string;
  userId: string;
  deckId: string;
  rating: Rating;
  source: ReviewSource;
  /** The AI client's name when `source` is `mcp`. */
  clientName: string | null;
  durationMs: number | null;
  reviewedAt: Date;
  /** The memory before this review, so undo restores it exactly; null for a first review. */
  previousMemory: SchedulingMemory | null;
  undoneAt: Date | null;
};

/** A card as the study module sees it, from the decks facade. */
export type StudyCard = {
  deckId: string;
  deckTitle: string;
  cardId: string;
  cardType: CardType;
  front: string;
  back: string;
  extra: string;
  createdAt: Date;
};

/**
 * The card sides a card is studied in: basic cards forward only,
 * reversible cards both ways (spec 3, card types).
 * @param cardType - the card's type
 * @returns the directions that have their own schedule
 */
export function studiedDirections(cardType: CardType): readonly StudyDirection[] {
  return cardType === 'reversible' ? ['forward', 'reverse'] : ['forward'];
}

/**
 * A stable map key for a schedule.
 * @param key - card and direction
 * @returns `<cardId>:<direction>`
 */
export function studyKeyOf(key: StudyKey): string {
  return `${key.cardId}:${key.direction}`;
}

/**
 * Orients a card for a direction: what to ask and what to reveal.
 * @param card - the card
 * @param direction - forward asks the front, reverse asks the back
 * @returns the prompt and the answer
 */
export function orientCard(
  card: Pick<StudyCard, 'front' | 'back'>,
  direction: StudyDirection,
): { prompt: string; answer: string } {
  if (direction === 'reverse') return { prompt: card.back, answer: card.front };
  return { prompt: card.front, answer: card.back };
}
