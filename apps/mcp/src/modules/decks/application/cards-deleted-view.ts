import type { Card, Deck, DeleteCardsOutput } from '@deck-club/contracts';
import { describeCard, toDeckCard } from './deck-detail-view.js';
import { cardCountLabel, deckUrl } from './deck-library-view.js';

/** What happened to each id of a `delete_cards` call. */
export type DeleteOutcome = {
  /** The cards deleted, as they were before, in the order asked for. */
  deleted: readonly Card[];
  /** Ids not in the deck: already deleted, or never there. */
  notFound: readonly string[];
  /** Ids in the deck left alone, because Deck Club stopped part-way. */
  notDeleted: readonly string[];
};

/**
 * Turns what a `delete_cards` call did into its result: the deck with its
 * new count, the deleted cards as they were, and the ids left alone.
 * @param deck - the deck
 * @param cardCountBefore - how many cards the deck had before the call
 * @param outcome - what happened to each id
 * @param webUrl - the web app's public URL
 * @returns the structured result
 */
export function toDeletedCards(
  deck: Deck,
  cardCountBefore: number,
  outcome: DeleteOutcome,
  webUrl: string,
): DeleteCardsOutput {
  return {
    deck: {
      id: deck.id,
      title: deck.title,
      url: deckUrl(webUrl, deck.id),
      cardCount: Math.max(0, cardCountBefore - outcome.deleted.length),
    },
    deleted: outcome.deleted.map(toDeckCard),
    notFound: [...outcome.notFound],
    notDeleted: [...outcome.notDeleted],
  };
}

/** What the AI is told about getting deleted cards back, while the API cannot restore them. */
const NO_RESTORE =
  'Deleted cards cannot be restored yet; if the user wants them back, add them again with add_cards (their study progress starts over).';

/**
 * The same result written for the AI: what was deleted, in full (the only
 * copy it has if the user wants the cards back), what was not and why, how
 * to retry safely, and the deck link.
 * @param output - the structured result
 * @returns compact text
 */
export function formatDeletedCards(output: DeleteCardsOutput): string {
  const { deck, deleted, notFound, notDeleted } = output;
  const where = `the deck "${deck.title}" (id: ${deck.id})`;
  if (deleted.length === 0)
    return `No cards were deleted from ${where}: none of these ids is in it (already deleted, or never there). Find card ids with get_deck or search_cards.`;
  const lines = [
    `Deleted ${cardCountLabel(deleted.length)} from ${where}; it now has ${cardCountLabel(deck.cardCount)}.`,
    'The deleted cards, as they were:',
    ...deleted.map((card) => `- ${card.id}: ${describeCard(card)}`),
  ];
  if (notFound.length > 0)
    lines.push(`Not in this deck (already deleted, or never there): ${notFound.join(', ')}`);
  if (notDeleted.length > 0)
    lines.push(
      `Not deleted, because Deck Club stopped part-way: ${notDeleted.join(', ')}. Calling delete_cards again with these ids is safe.`,
    );
  lines.push(NO_RESTORE, `Share the link with the user: ${deck.url}`);
  return lines.join('\n');
}
