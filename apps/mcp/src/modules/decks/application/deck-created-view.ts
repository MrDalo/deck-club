import type { CreateDeckOutput, Deck } from '@deck-club/contracts';
import { libraryUrl } from '../../../common/web/web-links.js';
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
    libraryUrl: libraryUrl(webUrl),
  };
}

/** Said first when the API answered a retried `create_deck` with the deck it made before. */
const DECK_ALREADY_CREATED =
  'Already done: an earlier create_deck call with this idempotencyKey created this deck, so no second deck was made.';

/**
 * The same result written for the AI: the id it needs for `add_cards`, that
 * the deck is private and empty, and the link to share with the user.
 * @param output - the structured result
 * @param replayed - whether this answers a retry with the deck an earlier call created
 * @returns compact text
 */
export function formatCreatedDeck(output: CreateDeckOutput, replayed = false): string {
  const { deck } = output;
  const tags = deck.tags.length === 0 ? '' : `, tags: ${deck.tags.join(', ')}`;
  return [
    ...(replayed ? [DECK_ALREADY_CREATED] : []),
    `Created the ${deck.visibility} deck "${deck.title}" (id: ${deck.id}, language: ${deck.language}${tags}).`,
    'It has no cards yet: add them with add_cards and this id.',
    `Share the link with the user: ${deck.url}`,
  ].join('\n');
}
