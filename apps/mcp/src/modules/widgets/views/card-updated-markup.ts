import {
  type CardEditField,
  type DeckCard,
  type McpToolName,
  type UpdateCardOutput,
  UpdateCardOutputSchema,
} from '@deck-club/contracts';
import { indexCard } from './card-components.js';
import { actionButton, pageHeader } from './components.js';
import { deckAccent } from './deck-accent.js';
import { escapeHtml } from './escape-html.js';
import { readToolOutput, type ToolResultLike } from './tool-output.js';

/** The view action that puts the changed fields back; its value is the card id. */
export const UNDO_CHANGE_ACTION = 'undo';

/** The server tool the view calls, through the host, to undo the change. */
export const UPDATE_CARD_TOOL: McpToolName = 'update_card';

const FIELD_LABELS: Readonly<Record<CardEditField, string>> = {
  front: 'Front',
  back: 'Back',
  extra: 'Extra',
  tags: 'Tags',
};

/** Marks a word that stands for no value, so it never reads as the card's own text. */
const none = (word: string): string => `<em class="change-none">${word}</em>`;

/** One field's value, escaped, as the change row shows it. */
const shownValue = (card: DeckCard, field: CardEditField): string => {
  if (field === 'tags')
    return card.tags.length === 0 ? none('No tags') : escapeHtml(card.tags.join(', '));
  return card[field] === '' ? none('Empty') : escapeHtml(card[field]);
};

const changeRow = (output: UpdateCardOutput, field: CardEditField): string => `
        <div class="change">
          <dt>${FIELD_LABELS[field]}</dt>
          <dd><span class="visually-hidden">Before: </span><del>${shownValue(output.previous, field)}</del> <span class="change-arrow" aria-hidden="true">→</span> <span class="visually-hidden">After: </span><ins>${shownValue(output.card, field)}</ins></dd>
        </div>`;

const changesPanel = (output: UpdateCardOutput): string => {
  const { deck, card, changedFields } = output;
  const open = actionButton({
    label: 'Open in Deck Club',
    action: 'open',
    value: deck.url,
    variant: 'secondary',
    accessibleName: `Open ${deck.title} in Deck Club`,
  });
  if (changedFields.length === 0)
    return `
    <section class="panel" aria-labelledby="card-changes-title">
      <h2 id="card-changes-title">Nothing changed</h2>
      <p class="lead">The card already had these values.</p>
      <div class="actions">${open}</div>
    </section>`;
  return `
    <section class="panel" aria-labelledby="card-changes-title">
      <h2 id="card-changes-title">What changed</h2>
      <dl class="changes">${changedFields.map((field) => changeRow(output, field)).join('')}
      </dl>
      <div class="actions">
        ${actionButton({ label: 'Undo this change', action: UNDO_CHANGE_ACTION, value: card.id })}
        ${open}
      </div>
    </section>`;
};

/**
 * One card the AI just edited, as the chat shows it: "Card updated" on the
 * deck's own pastel, the card as a ruled index card as it is now, then each
 * change before and after, and a button that puts the old values back.
 * @param output - the `update_card` result
 * @returns the HTML of the view's body
 */
export function renderCardUpdated(output: UpdateCardOutput): string {
  const changed = output.changedFields.length > 0;
  const header = pageHeader({
    title: changed ? 'Card updated' : 'Card unchanged',
    lead: changed
      ? `In ${output.deck.title} · your study progress is kept`
      : `In ${output.deck.title}`,
    accent: deckAccent(output.deck.id),
  });
  return `${header}
    <ul class="card-list">${indexCard(output.card)}
    </ul>
    ${changesPanel(output)}`;
}

/**
 * The `update_card` arguments that put the changed fields back as they
 * were, and leave every other field alone.
 * @param output - the edit to undo
 * @returns the tool arguments
 */
export function undoArguments(output: UpdateCardOutput): Record<string, unknown> {
  return {
    deckId: output.deck.id,
    cardId: output.card.id,
    ...Object.fromEntries(output.changedFields.map((field) => [field, output.previous[field]])),
  };
}

/**
 * Reads the result of the undo the view sent itself.
 * @param result - the tool result the host relayed
 * @returns the card after the undo, or null when the tool refused or the result breaks the contract
 */
export function readUpdatedCard(result: ToolResultLike): UpdateCardOutput | null {
  return readToolOutput(UpdateCardOutputSchema, result);
}
