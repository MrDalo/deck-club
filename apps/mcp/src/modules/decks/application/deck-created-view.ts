import type { CreateDeckOutput, Deck } from '@deck-club/contracts';
import { toDeckSummary } from './deck-library-view.js';

/**
 * Turns the deck the API created into the `create_deck` result: the data its
 * MCP Apps view renders, with the tags and visibility it was created with.
 * @param deck - the new deck as the API returns it
 * @param webUrl - the web app's public URL
 * @returns the structured result
 */
export function toCreatedDeck(deck: Deck, webUrl: string): CreateDeckOutput {
  return {
    deck: { ...toDeckSummary(deck, webUrl), tags: deck.tags, visibility: deck.visibility },
    libraryUrl: new URL('/decks', webUrl).toString(),
  };
}

/**
 * The same result written for the AI: the id it needs for `add_cards`, that
 * the deck is private and empty, and the link to share with the user.
 * @param output - the structured result
 * @returns compact text
 */
export function formatCreatedDeck(output: CreateDeckOutput): string {
  const { deck } = output;
  const tags = deck.tags.length === 0 ? '' : `, tags: ${deck.tags.join(', ')}`;
  return [
    `Created the ${deck.visibility} deck "${deck.title}" (id: ${deck.id}, language: ${deck.language}${tags}).`,
    'It has no cards yet: add them with add_cards and this id.',
    `Share the link with the user: ${deck.url}`,
  ].join('\n');
}
