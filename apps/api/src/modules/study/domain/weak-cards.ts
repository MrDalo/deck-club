import { type StudyDirection, WEAK_CARD_RULE } from '@deck-club/contracts';
import { type Review, studyKeyOf } from './study-state.js';

/** One card side the user keeps forgetting, before its content is looked up. */
export type ForgottenSide = {
  deckId: string;
  cardId: string;
  direction: StudyDirection;
  /** How often it was rated Again in the window. */
  forgotten: number;
  lastForgottenAt: Date;
};

/**
 * The card sides the user keeps forgetting (spec 9, `get_stats`: weak
 * cards): each side rated Again at least {@link WEAK_CARD_RULE}`.minForgotten`
 * times since `since`, the most forgotten first, then the most recently
 * forgotten, then by card id so the order never wobbles. Every side that
 * qualifies is returned; the caller keeps the first it can still show (a
 * deleted card has no content left to show).
 * @param reviews - the user's reviews, not undone
 * @param since - the start of the window
 * @returns the weak sides, best first
 */
export function forgottenSides(reviews: readonly Review[], since: Date): ForgottenSide[] {
  const sides = new Map<string, ForgottenSide>();
  for (const review of reviews) {
    if (review.rating !== 'again' || review.reviewedAt < since) continue;
    const key = studyKeyOf(review);
    const side = sides.get(key);
    if (side === undefined) {
      sides.set(key, {
        deckId: review.deckId,
        cardId: review.cardId,
        direction: review.direction,
        forgotten: 1,
        lastForgottenAt: review.reviewedAt,
      });
      continue;
    }
    side.forgotten += 1;
    if (review.reviewedAt > side.lastForgottenAt) side.lastForgottenAt = review.reviewedAt;
  }
  return [...sides.values()]
    .filter((side) => side.forgotten >= WEAK_CARD_RULE.minForgotten)
    .sort(
      (first, second) =>
        second.forgotten - first.forgotten ||
        second.lastForgottenAt.getTime() - first.lastForgottenAt.getTime() ||
        first.cardId.localeCompare(second.cardId) ||
        first.direction.localeCompare(second.direction),
    );
}
