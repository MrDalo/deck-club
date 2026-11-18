import { type AddCardsOutput, type Card, DECK_PAGE_SIZE, type Deck } from '@deck-club/contracts';
import { toDeckCard, toDeckDetail } from './deck-detail-view.js';
import { cardCountLabel, toDeckSummary } from './deck-library-view.js';

/** How much of a card's front the AI's reply quotes next to its id. */
const FRONT_PREVIEW_LENGTH = 80;

/**
 * Where the cards just added start in the deck, read the way every deck
 * tool reads it. The API orders a deck by when each card was added, and a
 * batch shares one timestamp: its cards sit together at the end, but not
 * necessarily in the order they were sent.
 * @param deckCards - the deck's cards, in the API's order
 * @param added - the cards the call created
 * @returns the index of the first of them, or -1 when none is there
 */
function firstPositionOf(deckCards: readonly Card[], added: readonly Card[]): number {
  const addedIds = new Set(added.map((card) => card.id));
  return deckCards.findIndex((card) => addedIds.has(card.id));
}

/**
 * Turns a write into the `add_cards` result: a `get_deck` page that starts
 * at the first card just added, so its view can read the rest with
 * `get_deck` and the cursor, plus how many cards were added.
 *
 * When the deck could not be read back after the write, the result is built
 * from the cards as they were sent, after the cards the deck had before,
 * with no cursor: the cards exist, and saying otherwise would make the AI
 * add them again.
 * @param deck - the deck as it was before the write
 * @param deckCards - the deck's cards read back after the write, or null when that failed
 * @param added - the cards the call created, in the order they were sent
 * @param webUrl - the web app's public URL
 * @returns the structured result
 */
export function toCardsAdded(
  deck: Deck,
  deckCards: readonly Card[] | null,
  added: readonly Card[],
  webUrl: string,
): AddCardsOutput {
  const offset = deckCards === null ? -1 : firstPositionOf(deckCards, added);
  if (deckCards !== null && offset !== -1)
    return {
      ...toDeckDetail({ ...deck, cardCount: deckCards.length }, deckCards, offset, webUrl),
      addedCount: added.length,
    };
  return {
    deck: toDeckSummary({ ...deck, cardCount: deck.cardCount + added.length }, webUrl),
    cards: added.slice(0, DECK_PAGE_SIZE).map(toDeckCard),
    firstCardNumber: deck.cardCount + 1,
    nextCursor: null,
    addedCount: added.length,
  };
}

/**
 * A card's front on one short line, so the reply stays small for 100 cards.
 * @param front - the card's front
 * @returns the front, whitespace folded, cut with an ellipsis when long
 */
function frontPreview(front: string): string {
  const line = front.replace(/\s+/g, ' ').trim();
  return line.length <= FRONT_PREVIEW_LENGTH
    ? line
    : `${line.slice(0, FRONT_PREVIEW_LENGTH - 1).trimEnd()}…`;
}

/** Said first when the API answered a retried `add_cards` with the cards it added before. */
const CARDS_ALREADY_ADDED =
  'Already done: an earlier add_cards call with this idempotencyKey added these cards, so none were added twice.';

/**
 * The same result written for the AI: how many cards went into which deck,
 * the new card ids (what `update_card` and `delete_cards` take), each next to
 * the front the AI wrote, and the link to share with the user. The card
 * content itself is not repeated: the AI has just written it.
 * @param output - the structured result
 * @param added - every card the call created, in the order they were sent
 * @param replayed - whether this answers a retry with the cards an earlier call added
 * @returns compact text
 */
export function formatCardsAdded(
  output: AddCardsOutput,
  added: readonly Card[],
  replayed = false,
): string {
  const { deck } = output;
  return [
    ...(replayed ? [CARDS_ALREADY_ADDED] : []),
    `Added ${cardCountLabel(output.addedCount)} to the deck "${deck.title}" (id: ${deck.id}); it now has ${cardCountLabel(deck.cardCount)}.`,
    'New card ids, in the order you sent the cards:',
    ...added.map((card) => `- ${card.id}: [${card.type}] ${frontPreview(card.front)}`),
    `Share the link with the user: ${deck.url}`,
  ].join('\n');
}
