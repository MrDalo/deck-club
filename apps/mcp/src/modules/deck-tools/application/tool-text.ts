import type { Card, Deck } from '@deck-club/contracts';
import type { DeckWithCards } from './ports/deck-club-api.js';

/**
 * Tool results are compact text written for an AI to read and relay
 * (product spec 9: short, human-readable). Ids are included so the AI can
 * chain calls; links let the user jump to the deck in the web app.
 */

/** Link to a deck in the web app. */
export function deckUrl(webUrl: string, deckId: string): string {
  return new URL(`/decks/${deckId}`, webUrl).toString();
}

const cardCountLabel = (count: number): string => (count === 1 ? '1 card' : `${count} cards`);

/**
 * @param decks - the user's decks
 * @param webUrl - the web app's public URL
 * @returns one line per deck, or guidance when the library is empty
 */
export function formatDeckList(decks: readonly Deck[], webUrl: string): string {
  if (decks.length === 0) return 'The user has no decks yet. Offer to create one with create_deck.';
  const lines = decks.map(
    (deck) =>
      `- "${deck.title}" (id: ${deck.id}, language: ${deck.language}, ${cardCountLabel(deck.cardCount)}) ${deckUrl(webUrl, deck.id)}`,
  );
  return [`The user has ${decks.length} deck${decks.length === 1 ? '' : 's'}:`, ...lines].join(
    '\n',
  );
}

const formatCard = (card: Card, index: number): string => {
  const extra = card.extra === '' ? '' : ` | extra: ${card.extra}`;
  return `${index + 1}. [${card.type}] front: ${card.front} | back: ${card.back}${extra}`;
};

/**
 * @param entry - a deck and its cards
 * @param webUrl - the web app's public URL
 * @returns the deck header followed by its cards
 */
export function formatDeck(entry: DeckWithCards, webUrl: string): string {
  const { deck, cards } = entry;
  const header = `Deck "${deck.title}" (id: ${deck.id}, language: ${deck.language}, ${cardCountLabel(cards.length)}) ${deckUrl(webUrl, deck.id)}`;
  if (cards.length === 0) return `${header}\nIt has no cards yet. Use add_cards to add some.`;
  return [header, ...cards.map(formatCard)].join('\n');
}

/**
 * @param deck - the deck just created
 * @param webUrl - the web app's public URL
 * @returns a confirmation naming the id for the next call
 */
export function formatCreatedDeck(deck: Deck, webUrl: string): string {
  return `Created deck "${deck.title}" (id: ${deck.id}). Add cards with add_cards. ${deckUrl(webUrl, deck.id)}`;
}

/**
 * @param cards - the cards just created
 * @param deckId - the deck they were added to
 * @param webUrl - the web app's public URL
 * @returns a confirmation the AI can relay
 */
export function formatAddedCards(cards: readonly Card[], deckId: string, webUrl: string): string {
  return `Added ${cardCountLabel(cards.length)} to the deck. The user can review and edit them at ${deckUrl(webUrl, deckId)}`;
}
