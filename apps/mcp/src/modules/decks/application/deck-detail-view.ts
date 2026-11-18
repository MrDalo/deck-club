import type { Card, Deck, DeckCard, GetDeckOutput } from '@deck-club/contracts';
import { cardCountLabel, toDeckSummary } from './deck-library-view.js';
import { pageOf } from './deck-page.js';

/**
 * A card as `get_deck` shows it: its content, and who added it when that
 * was an AI client (the "Added by Claude" badge, spec 4.3).
 * @param card - the card as the API returns it
 * @returns the card for the AI and the view
 */
export function toDeckCard(card: Card): DeckCard {
  return {
    id: card.id,
    type: card.type,
    front: card.front,
    back: card.back,
    extra: card.extra,
    tags: card.tags,
    addedBy:
      card.provenance.source === 'mcp' ? (card.provenance.clientName ?? 'an AI assistant') : null,
  };
}

/**
 * Turns a deck and its cards into the `get_deck` result: the deck and one
 * page of cards, with the cursor for the next page.
 * @param deck - the deck
 * @param cards - all of its cards, in the API's order
 * @param offset - where the requested page starts
 * @param webUrl - the web app's public URL
 * @returns the structured result
 */
export function toDeckDetail(
  deck: Deck,
  cards: readonly Card[],
  offset: number,
  webUrl: string,
): GetDeckOutput {
  const page = pageOf(deck.id, cards, offset);
  return {
    deck: toDeckSummary(deck, webUrl),
    cards: page.items.map(toDeckCard),
    firstCardNumber: page.firstNumber,
    nextCursor: page.nextCursor,
  };
}

/**
 * One card on one line, as every deck tool writes it for the AI.
 * @param card - the card
 * @returns `[type] front: … | back: … | extra: … | tags: … | added by …`
 */
export function describeCard(card: DeckCard): string {
  const parts = [`[${card.type}] front: ${card.front}`, `back: ${card.back}`];
  if (card.extra !== '') parts.push(`extra: ${card.extra}`);
  if (card.tags.length > 0) parts.push(`tags: ${card.tags.join(', ')}`);
  if (card.addedBy !== null) parts.push(`added by ${card.addedBy}`);
  return parts.join(' | ');
}

const cardLine = (card: DeckCard, number: number): string => `${number}. ${describeCard(card)}`;

/**
 * The same result written for the AI: the deck header, then one numbered
 * line per card, then how to read on.
 * @param detail - the structured result
 * @returns compact text, with guidance for an empty deck or an exhausted cursor
 */
export function formatDeckDetail(detail: GetDeckOutput): string {
  const { deck, cards, firstCardNumber, nextCursor } = detail;
  const lines = [
    `Deck "${deck.title}" (id: ${deck.id}, language: ${deck.language}, ${cardCountLabel(deck.cardCount)}) ${deck.url}`,
  ];
  if (deck.description !== '') lines.push(`About: ${deck.description}`);
  if (cards.length === 0) {
    lines.push(
      firstCardNumber === 1
        ? 'It has no cards yet. Use add_cards to add some.'
        : 'There are no more cards in this deck.',
    );
    return lines.join('\n');
  }
  const lastNumber = firstCardNumber + cards.length - 1;
  lines.push(`Cards ${firstCardNumber}–${lastNumber} of ${deck.cardCount}:`);
  lines.push(...cards.map((card, index) => cardLine(card, firstCardNumber + index)));
  if (nextCursor !== null)
    lines.push(`More cards: call get_deck again with cursor "${nextCursor}".`);
  return lines.join('\n');
}
