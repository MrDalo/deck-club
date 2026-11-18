import { ProtocolError, ProtocolErrorCode } from '@modelcontextprotocol/server';
import { describe, expect, it } from 'vitest';
import { DeckClubError } from '../errors/deck-club-error.js';
import { flattenVariables, toProtocolError } from './content-registration.js';

describe('toProtocolError', () => {
  it('keeps the REJECTED wording and the code for a refusal', () => {
    const error = toProtocolError(
      new DeckClubError('NOT_IMPLEMENTED', 'quiz_me is not available yet.'),
    );

    expect(error).toBeInstanceOf(ProtocolError);
    expect(error.code).toBe(ProtocolErrorCode.InternalError);
    expect(error.message).toContain('REJECTED: NOT_IMPLEMENTED. quiz_me is not available yet.');
    expect(error.data).toEqual({ code: 'NOT_IMPLEMENTED' });
  });

  it('maps a validation refusal to invalid params', () => {
    const error = toProtocolError(new DeckClubError('VALIDATION_FAILED', 'Use a deck id.'));

    expect(error.code).toBe(ProtocolErrorCode.InvalidParams);
  });

  it('hides the message of an unexpected error', () => {
    const error = toProtocolError(
      new TypeError('Cannot read properties of undefined (reading "token")'),
    );

    expect(error.message).toContain('REJECTED: INTERNAL.');
    expect(error.message).not.toContain('token');
  });
});

describe('flattenVariables', () => {
  it('keeps single values and takes the first of repeated ones', () => {
    expect(flattenVariables({ deckId: 'a', tags: ['x', 'y'], empty: [] })).toEqual({
      deckId: 'a',
      tags: 'x',
      empty: '',
    });
  });
});
