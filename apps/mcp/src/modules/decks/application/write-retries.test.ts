import { describe, expect, it } from 'vitest';
import { DeckClubError } from '../../../common/errors/deck-club-error.js';
import {
  explainRepeatableWriteRefusal,
  explainWriteRefusal,
  type WriteRetryAdvice,
} from './write-retries.js';

const ADVICE: WriteRetryAdvice = {
  tool: 'add_cards',
  outcome: 'the cards were added',
  check: 'call get_deck to check whether they are in the deck',
};
const unavailable = new DeckClubError('UPSTREAM_UNAVAILABLE', 'Deck Club is not reachable.');

describe('explainWriteRefusal', () => {
  it('tells the AI to resend an unconfirmed write with the same key, which is safe', () => {
    expect(explainWriteRefusal(unavailable, ADVICE, true)).toEqual(
      new DeckClubError(
        'UPSTREAM_UNAVAILABLE',
        'Deck Club did not confirm that the cards were added. Call add_cards again with exactly the same arguments and the same idempotencyKey: it is never done twice.',
      ),
    );
  });

  it('tells the AI to check first when the unconfirmed write had no key', () => {
    expect(explainWriteRefusal(unavailable, ADVICE, false)).toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
      detail:
        'Deck Club did not confirm that the cards were added. Before trying again, call get_deck to check whether they are in the deck, so nothing is done twice.',
    });
  });

  it('explains a running call in the words of the tool’s argument', () => {
    const inUse = new DeckClubError(
      'IDEMPOTENCY_KEY_IN_USE',
      'A request with this Idempotency-Key is still running.',
    );

    expect(explainWriteRefusal(inUse, ADVICE, true)).toMatchObject({
      code: 'IDEMPOTENCY_KEY_IN_USE',
      detail: expect.stringMatching(
        /^An earlier add_cards call with this idempotencyKey is still running\. Wait/,
      ) as string,
    });
  });

  it('explains a reused key in the words of the tool’s argument', () => {
    const reused = new DeckClubError(
      'IDEMPOTENCY_KEY_REUSED',
      'This Idempotency-Key was already used.',
    );

    expect(explainWriteRefusal(reused, ADVICE, true)).toMatchObject({
      code: 'IDEMPOTENCY_KEY_REUSED',
      detail: expect.stringContaining('Use a new key for a new add_cards call') as string,
    });
  });

  it('leaves every other refusal as the API wrote it, field problems included', () => {
    const invalid = new DeckClubError('VALIDATION_FAILED', 'The request body is invalid.', [
      { path: 'cards.0.front', message: 'Too long' },
    ]);

    expect(explainWriteRefusal(invalid, ADVICE, true)).toBe(invalid);
  });

  it('leaves an unexpected error alone, so it is reported as INTERNAL', () => {
    const bug = new TypeError('undefined is not a function');

    expect(explainWriteRefusal(bug, ADVICE, true)).toBe(bug);
  });
});

describe('explainRepeatableWriteRefusal', () => {
  const EDIT = {
    tool: 'update_card',
    outcome: 'the card was updated',
    safeBecause: 'it sets the same values',
  } as const;

  it('tells the AI that sending the same edit again is safe', () => {
    expect(explainRepeatableWriteRefusal(unavailable, EDIT)).toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
      detail:
        'Deck Club did not confirm that the card was updated. Calling update_card again with the same arguments is safe: it sets the same values.',
    });
  });

  it('leaves every other refusal as it is', () => {
    const notFound = new DeckClubError(
      'CARD_NOT_FOUND',
      'No card with that id exists in this deck.',
    );

    expect(explainRepeatableWriteRefusal(notFound, EDIT)).toBe(notFound);
  });
});
