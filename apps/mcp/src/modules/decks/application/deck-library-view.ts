import type { Deck, DeckSummary, ListDecksOutput } from '@deck-club/contracts';
import { countLabel } from '../../../common/text/count-label.js';
import { deckUrl, libraryUrl } from '../../../common/web/web-links.js';

/**
 * A deck as both deck tools show it: what the AI and the views need, with
 * the link into the web app, and nothing else.
 * @param deck - the deck as the API returns it
 * @param webUrl - the web app's public URL
 * @returns the summary
 */
export function toDeckSummary(deck: Deck, webUrl: string): DeckSummary {
  return {
    id: deck.id,
    title: deck.title,
    description: deck.description,
    language: deck.language,
    cardCount: deck.cardCount,
    url: deckUrl(webUrl, deck.id),
  };
}

/**
 * Turns the API's decks into the `list_decks` result: the data its MCP Apps
 * view renders and the AI reads as structured content.
 * @param decks - the caller's decks
 * @param webUrl - the web app's public URL
 * @returns the structured result
 */
export function toDeckLibrary(decks: readonly Deck[], webUrl: string): ListDecksOutput {
  return {
    decks: decks.map((deck) => toDeckSummary(deck, webUrl)),
    deckCount: decks.length,
    libraryUrl: libraryUrl(webUrl),
  };
}

/**
 * "1 card" or "N cards", for text the AI relays.
 * @param count - how many cards
 * @returns the label
 */
export const cardCountLabel = (count: number): string => countLabel(count, 'card');

/**
 * The same result written for the AI to read and relay: one line per deck,
 * with the ids it needs to chain calls and links for the user.
 * @param library - the structured result
 * @returns compact text, or guidance when the library is empty
 */
export function formatDeckLibrary(library: ListDecksOutput): string {
  if (library.deckCount === 0)
    return 'The user has no decks yet. Offer to create one with create_deck.';
  const lines = library.decks.map(
    (deck) =>
      `- "${deck.title}" (id: ${deck.id}, language: ${deck.language}, ${cardCountLabel(deck.cardCount)}) ${deck.url}`,
  );
  return [
    `The user has ${library.deckCount} deck${library.deckCount === 1 ? '' : 's'}:`,
    ...lines,
  ].join('\n');
}
