import {
  CARD_EDIT_FIELDS,
  type Card,
  type CardEditField,
  type Deck,
  type DeckCard,
  type UpdateCardOutput,
} from '@deck-club/contracts';
import { describeCard, toDeckCard } from './deck-detail-view.js';
import { deckUrl } from './deck-library-view.js';

const sameValue = (before: DeckCard, after: DeckCard, field: CardEditField): boolean => {
  const [was, is] = [before[field], after[field]];
  return typeof was === 'string' || typeof is === 'string'
    ? was === is
    : was.length === is.length && was.every((tag, index) => tag === is[index]);
};

/**
 * The fields whose value differs between two versions of a card, compared
 * as the API stored them (trimmed text, lowercase tags), not as the AI sent
 * them.
 * @param before - the card before the edit
 * @param after - the card the API answered with
 * @returns the changed fields, in card order
 */
export function changedFieldsOf(
  before: DeckCard,
  after: DeckCard,
): UpdateCardOutput['changedFields'] {
  return CARD_EDIT_FIELDS.filter((field) => !sameValue(before, after, field));
}

/**
 * Turns an edit into the `update_card` result: the card as it is now and as
 * it was, and which fields changed, so the view can show (and undo) the edit.
 * @param deck - the card's deck
 * @param previous - the card before the edit
 * @param updated - the card the API answered with
 * @param webUrl - the web app's public URL
 * @returns the structured result
 */
export function toUpdatedCard(
  deck: Deck,
  previous: Card,
  updated: Card,
  webUrl: string,
): UpdateCardOutput {
  const [before, after] = [toDeckCard(previous), toDeckCard(updated)];
  return {
    deck: { id: deck.id, title: deck.title, url: deckUrl(webUrl, deck.id) },
    card: after,
    previous: before,
    changedFields: changedFieldsOf(before, after),
  };
}

/**
 * One field's value as the AI reads it in a change line.
 * @param card - the card
 * @param field - the field
 * @returns the quoted text, the tags, or a word for nothing
 */
function valueOf(card: DeckCard, field: CardEditField): string {
  if (field === 'tags') return card.tags.length === 0 ? '(no tags)' : card.tags.join(', ');
  return card[field] === '' ? '(empty)' : `"${card[field]}"`;
}

/**
 * The same result written for the AI: which card changed, each change as
 * before → after (what it needs to undo the edit if the user asks), that the
 * user's study progress is kept, the card as it is now and the deck link.
 * @param output - the structured result
 * @returns compact text
 */
export function formatUpdatedCard(output: UpdateCardOutput): string {
  const { deck, card, previous, changedFields } = output;
  const where = `card ${card.id} in the deck "${deck.title}" (id: ${deck.id})`;
  const changes =
    changedFields.length === 0
      ? [`The ${where} already had these values; nothing changed.`]
      : [
          `Updated the ${where}. The user's study progress on it is kept.`,
          ...changedFields.map(
            (field) => `- ${field}: ${valueOf(previous, field)} → ${valueOf(card, field)}`,
          ),
        ];
  return [
    ...changes,
    `Now: ${describeCard(card)}`,
    `Share the link with the user: ${deck.url}`,
  ].join('\n');
}
