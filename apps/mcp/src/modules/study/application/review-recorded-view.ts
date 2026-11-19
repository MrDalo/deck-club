import type { SubmitReviewOutput } from '@deck-club/contracts';
import { timeUntil } from '../../../common/time/time-until.js';
import type { RecordedReview } from './ports/study-api.js';

/**
 * Turns the review the API recorded into the `submit_review` result, the
 * data the study session view reads when it records a rating itself.
 * @param recorded - the API's review and whether it was a replay
 * @param deckId - the card's deck, as the call named it
 * @param asOf - when the answer was given, an ISO timestamp
 * @returns the structured result
 */
export function toReviewRecorded(
  recorded: RecordedReview,
  deckId: string,
  asOf: string,
): SubmitReviewOutput {
  return { ...recorded.review, deckId, replayed: recorded.replayed, asOf };
}

const ALREADY_RECORDED =
  'Already done: an earlier submit_review call with this idempotencyKey recorded this rating, so it was not recorded twice.';

/** What the card's new state means for the rest of the quiz. */
const nextStep = (output: SubmitReviewOutput): string =>
  output.state === 'learning' || output.state === 'relearning'
    ? 'It stays in today’s session: get_due_cards shows it again when it is due. Go on with the next card.'
    : 'Go on with the next card.';

/**
 * The same result written for the AI: what was recorded for which card,
 * when the card comes back (to tell the user), and what to do next.
 * @param output - the structured result
 * @returns compact text
 */
export function formatReviewRecorded(output: SubmitReviewOutput): string {
  return [
    ...(output.replayed ? [ALREADY_RECORDED] : []),
    `Recorded "${output.rating}" for card ${output.cardId} (${output.direction}) in deck ${output.deckId}. It is now in ${output.state} and comes back in ${timeUntil(output.asOf, output.nextDueAt)} (${output.nextDueAt}).`,
    nextStep(output),
  ].join('\n');
}
