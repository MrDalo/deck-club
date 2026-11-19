import type { McpToolName } from '@deck-club/contracts';
import { DeckClubError } from './deck-club-error.js';

/** How one write tool tells the AI to recover when a call may or may not have written. */
export type WriteRetryAdvice = {
  /** The tool the AI calls again. */
  tool: McpToolName;
  /** What the write does, as in "did not confirm that …": "the cards were added". */
  outcome: string;
  /** How to find out, without a key, whether it happened: "call get_deck to check whether they are in the deck". */
  check: string;
};

/**
 * Rewrites the API's refusals that are about retrying into advice for the
 * AI, in the words of the tool's `idempotencyKey` argument rather than the
 * HTTP header (ADR 0009). A write whose answer was lost (UPSTREAM_UNAVAILABLE:
 * a timeout can hide a write that happened) is safe to send again with the
 * same key; without one the AI must check first. Every other error is
 * returned as it is.
 * @param error - what the write threw
 * @param advice - the tool's own words
 * @param keyed - whether the call carried an idempotency key
 * @returns the error to throw
 */
export function explainWriteRefusal(
  error: unknown,
  advice: WriteRetryAdvice,
  keyed: boolean,
): unknown {
  if (!(error instanceof DeckClubError)) return error;
  switch (error.code) {
    case 'UPSTREAM_UNAVAILABLE':
      return new DeckClubError(
        'UPSTREAM_UNAVAILABLE',
        keyed
          ? `Deck Club did not confirm that ${advice.outcome}. Call ${advice.tool} again with exactly the same arguments and the same idempotencyKey: it is never done twice.`
          : `Deck Club did not confirm that ${advice.outcome}. Before trying again, ${advice.check}, so nothing is done twice.`,
      );
    case 'IDEMPOTENCY_KEY_IN_USE':
      return new DeckClubError(
        'IDEMPOTENCY_KEY_IN_USE',
        `An earlier ${advice.tool} call with this idempotencyKey is still running. Wait a few seconds, then call again with exactly the same arguments and key.`,
      );
    case 'IDEMPOTENCY_KEY_REUSED':
      return new DeckClubError(
        'IDEMPOTENCY_KEY_REUSED',
        `This idempotencyKey was already used for a different call. Use a new key for a new ${advice.tool} call; reuse a key only to retry exactly the same call.`,
      );
    default:
      return error;
  }
}

/** How a write that is safe to repeat tells the AI to recover. */
export type RepeatableWriteAdvice = Pick<WriteRetryAdvice, 'tool' | 'outcome'> & {
  /** Why sending it again is safe: "it sets the same values". */
  safeBecause: string;
};

/**
 * For a write that gives the same result however often it is sent, such as
 * setting a card's fields or deleting cards: when its answer was lost,
 * sending it again is simply safe, key or no key. Every other error is
 * returned as it is.
 * @param error - what the write threw
 * @param advice - the tool, what it does, and why a repeat is safe
 * @returns the error to throw
 */
export function explainRepeatableWriteRefusal(
  error: unknown,
  advice: RepeatableWriteAdvice,
): unknown {
  if (!(error instanceof DeckClubError) || error.code !== 'UPSTREAM_UNAVAILABLE') return error;
  return new DeckClubError(
    'UPSTREAM_UNAVAILABLE',
    `Deck Club did not confirm that ${advice.outcome}. Calling ${advice.tool} again with the same arguments is safe: ${advice.safeBecause}.`,
  );
}
