import { describe, expect, it } from 'vitest';
import { decodeCursor, encodeCursor, pageOf } from './deck-page.js';

const DECK = '00000000-0000-4000-8000-000000000001';
const OTHER_DECK = '00000000-0000-4000-8000-000000000002';
const numbers = (count: number): number[] => Array.from({ length: count }, (_, index) => index + 1);

describe('decodeCursor', () => {
  it('starts at the first card without a cursor', () => {
    expect(decodeCursor(DECK, undefined)).toBe(0);
  });

  it('reads back a cursor it made for the same deck', () => {
    expect(decodeCursor(DECK, encodeCursor(DECK, 25))).toBe(25);
  });

  it('refuses a cursor made for another deck', () => {
    expect(() => decodeCursor(DECK, encodeCursor(OTHER_DECK, 25))).toThrow(
      expect.objectContaining({ code: 'VALIDATION_FAILED' }) as Error,
    );
  });

  it('refuses a cursor the AI made up, and says how to recover', () => {
    expect(() => decodeCursor(DECK, 'page-2')).toThrow(
      expect.objectContaining({
        code: 'VALIDATION_FAILED',
        detail: expect.stringContaining('without a cursor') as string,
      }) as Error,
    );
  });

  it('refuses a forged cursor with a negative or fractional offset', () => {
    const forge = (offset: number): string =>
      Buffer.from(JSON.stringify({ deckId: DECK, offset })).toString('base64url');

    expect(() => decodeCursor(DECK, forge(-5))).toThrow();
    expect(() => decodeCursor(DECK, forge(2.5))).toThrow();
  });

  it('refuses valid JSON that is not a cursor', () => {
    expect(() => decodeCursor(DECK, Buffer.from('[1,2]').toString('base64url'))).toThrow();
  });
});

describe('pageOf', () => {
  it('returns the first page and a cursor to the next', () => {
    const page = pageOf(DECK, numbers(30), 0, 25);

    expect(page.items).toEqual(numbers(25));
    expect(page.firstNumber).toBe(1);
    expect(decodeCursor(DECK, page.nextCursor ?? undefined)).toBe(25);
  });

  it('returns the last page without a cursor', () => {
    const page = pageOf(DECK, numbers(30), 25, 25);

    expect(page).toEqual({ items: [26, 27, 28, 29, 30], firstNumber: 26, nextCursor: null });
  });

  it('has no next page when the deck fills the page exactly', () => {
    expect(pageOf(DECK, numbers(25), 0, 25).nextCursor).toBeNull();
  });

  it('returns an empty last page when cards were deleted since the cursor was made', () => {
    expect(pageOf(DECK, numbers(3), 25, 25)).toEqual({
      items: [],
      firstNumber: 26,
      nextCursor: null,
    });
  });

  it('returns an empty page for an empty deck', () => {
    expect(pageOf(DECK, [], 0)).toEqual({ items: [], firstNumber: 1, nextCursor: null });
  });
});
