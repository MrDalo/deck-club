import {
  type AddCardsOutput,
  AddCardsOutputSchema,
  type DeckCard,
  type DeleteCardsOutput,
  type McpToolName,
} from '@deck-club/contracts';
import { askToDeleteRest } from './chat-messages.js';
import { actionButton, countLabel, notice, pageHeader } from './components.js';
import { deckAccent } from './deck-accent.js';
import { escapeHtml } from './escape-html.js';
import { readToolOutput, type ToolResultLike } from './tool-output.js';

/** The view action that adds the deleted cards back as new cards. */
export const ADD_BACK_ACTION = 'add-back';

/** The server tool the view calls, through the host, to add the cards back. */
export const ADD_CARDS_TOOL: McpToolName = 'add_cards';

/** What the view shows: the `delete_cards` result, and how many cards were added back since. */
export type CardsDeletedView = DeleteCardsOutput & {
  /** Set once "Add them back" worked: how many new cards were added. */
  addedBack?: number;
};

const deletedCard = (card: DeckCard): string => `
      <li class="deleted-card">
        <span class="visually-hidden">Deleted card. Front: </span><p class="deleted-front">${escapeHtml(card.front)}</p>
        <span class="visually-hidden">Back: </span><p class="deleted-back">${escapeHtml(card.back)}</p>
      </li>`;

const statusLines = (view: CardsDeletedView): string => {
  const lines: string[] = [];
  if (view.notFound.length > 0 && view.deleted.length > 0)
    lines.push(
      `<p class="lead page-status">${countLabel(view.notFound.length, 'other card was', 'other cards were')} not in this deck: already deleted, or never there.</p>`,
    );
  if (view.notDeleted.length > 0)
    lines.push(
      notice(
        `${countLabel(view.notDeleted.length, 'card was', 'cards were')} not deleted: Deck Club stopped part-way.`,
      ),
      `<div class="actions card-actions">${actionButton({ label: 'Try again', action: 'ask', value: askToDeleteRest(view.deck.title, view.notDeleted.length) })}</div>`,
    );
  return lines.join('');
};

const openDeck = (view: CardsDeletedView): string =>
  actionButton({
    label: 'Open in Deck Club',
    action: 'open',
    value: view.deck.url,
    variant: 'secondary',
    accessibleName: `Open ${view.deck.title} in Deck Club`,
  });

const addBackPanel = (view: CardsDeletedView): string => {
  if (view.addedBack !== undefined)
    return `
    <section class="panel" aria-labelledby="cards-deleted-next-title">
      <h2 id="cards-deleted-next-title">Added back</h2>
      <p class="lead">${countLabel(view.addedBack, 'card is', 'cards are')} back in the deck as new cards; their study progress starts over.</p>
      <div class="actions">${openDeck(view)}</div>
    </section>`;
  return `
    <section class="panel" aria-labelledby="cards-deleted-next-title">
      <h2 id="cards-deleted-next-title">Changed your mind?</h2>
      <p class="lead">Deleted cards cannot be restored yet. You can add them back as new cards; their study progress starts over.</p>
      <div class="actions">
        ${actionButton({ label: 'Add them back as new cards', action: ADD_BACK_ACTION, value: view.deck.id })}
        ${openDeck(view)}
      </div>
    </section>`;
};

/**
 * The cards the AI just deleted, as the chat shows them: "N cards deleted"
 * on the deck's own pastel and its new count, each deleted card on a dashed
 * slip, what was not deleted and why, and the way back: while Deck Club
 * cannot restore cards, the view offers to add them back as new cards.
 * @param view - the `delete_cards` result, and whether the cards were added back
 * @returns the HTML of the view's body
 */
export function renderCardsDeleted(view: CardsDeletedView): string {
  const { deck, deleted } = view;
  if (deleted.length === 0)
    return `${pageHeader({ title: 'Nothing deleted', lead: `None of these cards is in ${deck.title}: already deleted, or never there.`, accent: deckAccent(deck.id) })}
    ${statusLines(view)}
    <p class="footer">${openDeck(view)}</p>`;
  const header = pageHeader({
    title: `${countLabel(deleted.length, 'card')} deleted`,
    lead: `From ${deck.title} · now ${countLabel(deck.cardCount, 'card')}`,
    accent: deckAccent(deck.id),
  });
  return `${header}
    <ul class="deleted-list" aria-label="Deleted cards">${deleted.map(deletedCard).join('')}
    </ul>
    ${statusLines(view)}${addBackPanel(view)}`;
}

/**
 * FNV-1a over a string, as 8 hex digits, from a given starting value.
 * @param text - what to hash
 * @param seed - the offset basis
 * @returns the hash
 */
function fnv1a(text: string, seed: number): string {
  let hash = seed;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * The idempotency key of "Add them back": the same for the same deleted
 * cards, so a second click (or a retry) is answered with the cards the first
 * one added instead of adding them twice.
 * @param view - the deleted cards
 * @returns a key of letters, digits and dashes
 */
export function addBackKey(view: DeleteCardsOutput): string {
  const ids = view.deleted
    .map((card) => card.id)
    .sort()
    .join(',');
  return `add-back-${fnv1a(ids, 0x811c9dc5)}${fnv1a(ids, 0x01000193)}`;
}

/**
 * The `add_cards` arguments that add the deleted cards back to their deck
 * as new cards, with their content as it was.
 * @param view - the deleted cards
 * @returns the tool arguments
 */
export function addBackArguments(view: DeleteCardsOutput): Record<string, unknown> {
  return {
    deckId: view.deck.id,
    cards: view.deleted.map(({ type, front, back, extra, tags }) => ({
      type,
      front,
      back,
      extra,
      tags,
    })),
    idempotencyKey: addBackKey(view),
  };
}

/**
 * Reads the result of the `add_cards` call the view sent itself.
 * @param result - the tool result the host relayed
 * @returns the cards added back, or null when the tool refused or the result breaks the contract
 */
export function readAddedBack(result: ToolResultLike): AddCardsOutput | null {
  return readToolOutput(AddCardsOutputSchema, result);
}
