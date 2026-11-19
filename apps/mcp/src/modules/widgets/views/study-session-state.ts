import {
  type GetDueCardsOutput,
  GetDueCardsOutputSchema,
  type McpToolName,
  type Rating,
  RATINGS,
  type SubmitReviewOutput,
  SubmitReviewOutputSchema,
} from '@deck-club/contracts';
import { timeUntil } from '../../../common/time/time-until.js';
import { readToolOutput, type ToolResultLike } from './tool-output.js';

/**
 * What the study session view shows: the `get_due_cards` result, and the
 * ratings the user recorded from the view, by the card's place in the
 * session. The ratings live only in the view; the API holds the reviews.
 */
export type StudySession = GetDueCardsOutput & {
  reviewed?: Readonly<Record<number, SubmitReviewOutput>>;
};

/** The view action that records a rating; its value is `<card index>:<rating>`. */
export const RATE_ACTION = 'rate';

/** The view action that loads the next due cards once every card is rated. */
export const NEXT_CARDS_ACTION = 'next';

/** The server tool the view calls, through the host, to record a rating. */
export const SUBMIT_REVIEW_TOOL: McpToolName = 'submit_review';

/** The server tool the view calls, through the host, for the next due cards. */
export const DUE_CARDS_TOOL: McpToolName = 'get_due_cards';

/**
 * Names one `get_due_cards` result: the moment it was read. It makes the
 * ids of the view's elements and the idempotency keys of its ratings unique
 * to this session, and the same again when a host shows the result anew.
 * @param session - the session on screen
 * @returns digits
 */
export function sessionId(session: GetDueCardsOutput): string {
  return String(Date.parse(session.asOf));
}

/**
 * The value a rating button carries.
 * @param index - the card's place in the session
 * @param rating - the rating
 * @returns `<index>:<rating>`
 */
export function rateValue(index: number, rating: Rating): string {
  return `${index}:${rating}`;
}

/**
 * Reads a rating button's value back.
 * @param value - the button's value
 * @returns the card's place and the rating, or null for anything else
 */
export function parseRateValue(value: string): { index: number; rating: Rating } | null {
  const [index, rating] = value.split(':');
  const place = Number(index);
  const known = RATINGS.find((each) => each === rating);
  if (!Number.isSafeInteger(place) || place < 0 || known === undefined) return null;
  return { index: place, rating: known };
}

/**
 * The `submit_review` arguments for one rating from the view. The
 * idempotency key is the session and the card, not the rating: a double
 * click, a retry after a lost answer, or the same session shown again later
 * never records a second review for the card (ADR 0009).
 * @param session - the session on screen
 * @param index - the card's place in the session
 * @param rating - the rating the user picked
 * @returns the tool arguments, or null when there is no such card
 */
export function reviewArguments(
  session: GetDueCardsOutput,
  index: number,
  rating: Rating,
): Record<string, unknown> | null {
  const card = session.cards[index];
  if (card === undefined) return null;
  return {
    deckId: card.deckId,
    cardId: card.cardId,
    direction: card.direction,
    rating,
    idempotencyKey: `view-${sessionId(session)}-${card.cardId}-${card.direction}`,
  };
}

/**
 * The session with one more rating recorded, when the review is the card's.
 * @param session - the session on screen
 * @param index - the card's place in the session
 * @param review - what `submit_review` answered
 * @returns the new session, or null when the review is for another card
 */
export function withReview(
  session: StudySession,
  index: number,
  review: SubmitReviewOutput,
): StudySession | null {
  const card = session.cards[index];
  if (card?.cardId !== review.cardId || card.direction !== review.direction) return null;
  return { ...session, reviewed: { ...session.reviewed, [index]: review } };
}

/**
 * @param session - the session on screen
 * @returns how many of its cards were rated from the view
 */
export function ratedCount(session: StudySession): number {
  return Object.keys(session.reviewed ?? {}).length;
}

/**
 * The `get_due_cards` arguments for the cards that come after a finished
 * session: the same deck (or every deck), as many cards as before.
 * @param session - the finished session
 * @returns the tool arguments
 */
export function nextCardsArguments(session: GetDueCardsOutput): Record<string, unknown> {
  return {
    ...(session.deck !== null && { deckId: session.deck.id }),
    limit: Math.max(session.cards.length, 1),
  };
}

/**
 * What the assistant should know about the ratings made in the view, so a
 * quiz in the chat neither asks those cards again nor records them twice.
 * Hosts keep only the latest context a view sends, so it lists them all.
 * @param session - the session on screen
 * @returns the text for the model, or null before the first rating
 */
export function ratingsContext(session: StudySession): string | null {
  const lines = session.cards.flatMap((card, index) => {
    const review = session.reviewed?.[index];
    if (review === undefined) return [];
    return [
      `- "${card.prompt}" (deck id: ${card.deckId}, card id: ${card.cardId}, direction: ${card.direction}): ${review.rating}, back in ${timeUntil(review.asOf, review.nextDueAt)}`,
    ];
  });
  if (lines.length === 0) return null;
  return [
    'The user rated these cards themselves in the Deck Club study view. The ratings are recorded: do not ask these cards again and do not call submit_review for them.',
    ...lines,
  ].join('\n');
}

/**
 * Reads the result of a rating the view recorded itself.
 * @param result - the tool result the host relayed
 * @returns the review, or null when the tool refused or the result breaks the contract
 */
export function readReview(result: ToolResultLike): SubmitReviewOutput | null {
  return readToolOutput(SubmitReviewOutputSchema, result);
}

/**
 * Reads the next due cards the view fetched itself.
 * @param result - the tool result the host relayed
 * @returns the new session, or null when the tool refused or the result breaks the contract
 */
export function readDueCards(result: ToolResultLike): GetDueCardsOutput | null {
  return readToolOutput(GetDueCardsOutputSchema, result);
}
