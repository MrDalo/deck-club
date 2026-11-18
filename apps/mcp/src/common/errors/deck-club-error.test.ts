import { describe, expect, it } from 'vitest';
import { DeckClubError, describeRefusal, notImplemented } from './deck-club-error.js';

describe('DeckClubError', () => {
  it('keeps the code and the relayable detail apart', () => {
    const error = new DeckClubError('DECK_NOT_FOUND', 'No deck with that id.');

    expect(error).toMatchObject({ code: 'DECK_NOT_FOUND', detail: 'No deck with that id.' });
    expect(error.message).toBe('DECK_NOT_FOUND: No deck with that id.');
  });
});

describe('notImplemented', () => {
  it('rejects with NOT_IMPLEMENTED naming the capability', async () => {
    await expect(notImplemented('list_decks')).rejects.toMatchObject({
      code: 'NOT_IMPLEMENTED',
      detail: expect.stringContaining('list_decks') as string,
    });
  });

  it('rejects with a DeckClubError so every adapter can map it', async () => {
    await expect(notImplemented('quiz_me')).rejects.toBeInstanceOf(DeckClubError);
  });
});

describe('describeRefusal', () => {
  it('reads REJECTED: <CODE>. <detail>', () => {
    expect(describeRefusal(new DeckClubError('DECK_NOT_FOUND', 'No deck with that id.'))).toBe(
      'REJECTED: DECK_NOT_FOUND. No deck with that id.',
    );
  });

  it('lists each field problem so the AI can correct its call', () => {
    const error = new DeckClubError('VALIDATION_FAILED', 'The request body is invalid.', [
      { path: 'title', message: 'Too long' },
      { path: 'tags.0', message: 'Use letters and numbers' },
    ]);

    expect(describeRefusal(error)).toBe(
      'REJECTED: VALIDATION_FAILED. The request body is invalid. Fix: title: Too long; tags.0: Use letters and numbers.',
    );
  });

  it('names a problem with the whole input', () => {
    const error = new DeckClubError('VALIDATION_FAILED', 'Invalid.', [
      { path: '', message: 'Change at least one field.' },
    ]);

    expect(describeRefusal(error)).toContain('Fix: input: Change at least one field.');
  });
});
