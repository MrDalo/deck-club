import { DECK_PAGE_SIZE } from '@deck-club/contracts';
import { DeckClubError } from '../../../common/errors/deck-club-error.js';

/** What a `get_deck` cursor carries: where the next page starts, and for which deck. */
type CursorPayload = { deckId: string; offset: number };

/** One page of a deck's cards. */
export type CardPage<Item> = {
  items: Item[];
  /** 1-based position of the first item in the whole list. */
  firstNumber: number;
  /** Where the next page starts, or null on the last page. */
  nextCursor: string | null;
};

const invalidCursor = (): DeckClubError =>
  new DeckClubError(
    'VALIDATION_FAILED',
    'That cursor does not belong to this deck. Call get_deck without a cursor to start from the first card.',
  );

/**
 * Makes the opaque cursor `get_deck` hands out for the next page. It is
 * bound to the deck, so a cursor pasted into a call for another deck is
 * refused rather than silently reading the wrong place.
 * @param deckId - the deck being paged
 * @param offset - where the next page starts
 * @returns the cursor
 */
export function encodeCursor(deckId: string, offset: number): string {
  const payload: CursorPayload = { deckId, offset };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

const isPayload = (value: unknown): value is CursorPayload =>
  typeof value === 'object' &&
  value !== null &&
  'deckId' in value &&
  typeof value.deckId === 'string' &&
  'offset' in value &&
  Number.isSafeInteger(value.offset) &&
  (value.offset as number) >= 0;

/**
 * Reads a cursor back. The AI passes it verbatim, so anything else is
 * refused with a sentence that tells it how to recover.
 * @param deckId - the deck the call is for
 * @param cursor - the cursor from the call, if any
 * @returns where the page starts
 * @throws DeckClubError VALIDATION_FAILED for a cursor this server did not make for this deck
 */
export function decodeCursor(deckId: string, cursor: string | undefined): number {
  if (cursor === undefined) return 0;
  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
  } catch {
    throw invalidCursor();
  }
  if (!isPayload(payload) || payload.deckId !== deckId) throw invalidCursor();
  return payload.offset;
}

/**
 * Cuts one page out of a deck's cards. The core API returns a deck's cards
 * in one answer; paging here keeps a large deck from flooding the AI's
 * context. A start past the end (cards deleted meanwhile) is an empty last
 * page, not an error.
 * @param deckId - the deck, for the next cursor
 * @param items - all of the deck's cards
 * @param offset - where the page starts
 * @param size - the page size
 * @returns the page
 */
export function pageOf<Item>(
  deckId: string,
  items: readonly Item[],
  offset: number,
  size: number = DECK_PAGE_SIZE,
): CardPage<Item> {
  const end = offset + size;
  return {
    items: items.slice(offset, end),
    firstNumber: offset + 1,
    nextCursor: end < items.length ? encodeCursor(deckId, end) : null,
  };
}
