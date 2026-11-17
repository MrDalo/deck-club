import type { Review } from './study-state.js';

/**
 * Retention (spec 6): the share of reviews of cards in the review state that
 * were remembered (rated Hard, Good or Easy).
 * @param reviews - reviews from the measured window, not undone
 * @returns a share between 0 and 1, or null when no review-state card was reviewed
 */
export function retentionOf(reviews: readonly Review[]): number | null {
  const ofReviewCards = reviews.filter((review) => review.previousMemory?.state === 'review');
  if (ofReviewCards.length === 0) return null;
  const remembered = ofReviewCards.filter((review) => review.rating !== 'again').length;
  return remembered / ofReviewCards.length;
}
