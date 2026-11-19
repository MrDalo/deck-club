import { describe, expect, it } from 'vitest';
import { deckUrl, libraryUrl } from './web-links.js';

const WEB_URL = 'https://deck.club';
const DECK_ID = '00000000-0000-4000-8000-000000000001';

describe('deckUrl', () => {
  it('points at the deck page of the web app', () => {
    expect(deckUrl(WEB_URL, DECK_ID)).toBe(`https://deck.club/decks/${DECK_ID}`);
  });

  it('keeps working when the web app sits on a path', () => {
    expect(deckUrl('https://deck.club/app/', DECK_ID)).toBe(`https://deck.club/decks/${DECK_ID}`);
  });
});

describe('libraryUrl', () => {
  it('points at the deck library of the web app', () => {
    expect(libraryUrl(`${WEB_URL}/`)).toBe('https://deck.club/decks');
  });
});
