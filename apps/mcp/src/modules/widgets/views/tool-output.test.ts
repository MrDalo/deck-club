import { ListDecksOutputSchema } from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import { readToolOutput } from './tool-output.js';

const LIBRARY = { decks: [], deckCount: 0, libraryUrl: 'https://deck.club/decks' };

describe('readToolOutput', () => {
  it('returns the structured output that matches the schema', () => {
    expect(readToolOutput(ListDecksOutputSchema, { structuredContent: LIBRARY })).toEqual(LIBRARY);
  });

  it('returns null for a refusal, even with content', () => {
    expect(
      readToolOutput(ListDecksOutputSchema, { isError: true, structuredContent: LIBRARY }),
    ).toBeNull();
  });

  it('returns null for output that breaks the contract or is missing', () => {
    expect(readToolOutput(ListDecksOutputSchema, { structuredContent: { decks: 'x' } })).toBeNull();
    expect(readToolOutput(ListDecksOutputSchema, {})).toBeNull();
  });
});
