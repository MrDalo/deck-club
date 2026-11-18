import { type GetDeckOutput, GetDeckOutputSchema, type McpToolName } from '@deck-club/contracts';
import { indexCard } from './card-components.js';
import { askForCards, askForQuiz } from './chat-messages.js';
import { actionButton, countLabel, emptyState, pageHeader } from './components.js';
import { deckAccent } from './deck-accent.js';
import { readToolOutput, type ToolResultLike } from './tool-output.js';

/** The view action that loads the next page; its value is the page's cursor. */
export const MORE_CARDS_ACTION = 'more';

/** The server tool the deck view calls, through the host, for the next page. */
export const DECK_TOOL: McpToolName = 'get_deck';

const deckLead = (detail: GetDeckOutput): string => {
  const { deck } = detail;
  const summary = `${deck.language.toUpperCase()} · ${countLabel(deck.cardCount, 'card')}`;
  return deck.description === '' ? summary : `${deck.description} · ${summary}`;
};

const pageStatus = (detail: GetDeckOutput): string => {
  const last = detail.firstCardNumber + detail.cards.length - 1;
  const range = detail.firstCardNumber === last ? `${last}` : `${detail.firstCardNumber}–${last}`;
  return `<p class="lead page-status">Showing cards ${range} of ${detail.deck.cardCount}</p>`;
};

const deckActions = (detail: GetDeckOutput): string => {
  const { deck, nextCursor } = detail;
  const more =
    nextCursor === null
      ? ''
      : actionButton({ label: 'Show more cards', action: MORE_CARDS_ACTION, value: nextCursor });
  return `
    <div class="actions footer">
      ${more}
      ${actionButton({ label: 'Quiz me on this deck', action: 'ask', value: askForQuiz(deck.title), variant: more === '' ? 'primary' : 'secondary' })}
      ${actionButton({ label: 'Open in Deck Club', action: 'open', value: deck.url, variant: 'secondary' })}
    </div>`;
};

/**
 * One deck as the chat shows it, like its page in the web app: the title on
 * the deck's own pastel highlighter, then each card as a ruled index card
 * with its two sides and its chips (Reversible, tags, "Added by Claude").
 * @param detail - the `get_deck` result, or several pages of it merged
 * @returns the HTML of the view's body
 */
export function renderDeck(detail: GetDeckOutput): string {
  const { deck, cards } = detail;
  const header = pageHeader({
    title: deck.title,
    lead: deckLead(detail),
    accent: deckAccent(deck.id),
  });
  if (cards.length === 0 && detail.firstCardNumber === 1)
    return `${header}${emptyState(
      'No cards yet',
      'Ask the assistant to write some for this deck.',
      actionButton({ label: 'Add cards', action: 'ask', value: askForCards(deck.title) }),
    )}`;
  return `${header}
    <ol class="card-list" start="${detail.firstCardNumber}">${cards.map((card) => indexCard(card)).join('')}
    </ol>
    ${cards.length === 0 ? '' : pageStatus(detail)}${deckActions(detail)}`;
}

/**
 * Adds the next page to the cards already on screen, so "Show more cards"
 * grows the list instead of replacing it.
 * @param shown - what the view shows now
 * @param next - the next page, from the same deck
 * @returns both pages as one, with the newer deck summary and cursor
 */
export function appendPage(shown: GetDeckOutput, next: GetDeckOutput): GetDeckOutput {
  return {
    deck: next.deck,
    cards: [...shown.cards, ...next.cards],
    firstCardNumber: shown.firstCardNumber,
    nextCursor: next.nextCursor,
  };
}

/**
 * Reads the next page out of a `get_deck` result the view fetched itself.
 * @param result - the tool result the host relayed
 * @returns the page, or null when the tool refused or the result breaks the contract
 */
export function readNextPage(result: ToolResultLike): GetDeckOutput | null {
  return readToolOutput(GetDeckOutputSchema, result);
}
