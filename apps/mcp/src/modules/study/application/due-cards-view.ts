import type { Deck, DueCard, DueCards, GetDueCardsOutput } from '@deck-club/contracts';
import { deckUrl, libraryUrl } from '../../../common/web/web-links.js';

/**
 * Turns the API's due cards into the `get_due_cards` result: the data its
 * study session view renders and the AI reads as structured content.
 * @param due - the API's first due cards, in session order, and the total
 * @param deck - the deck the session is limited to, or null for every deck
 * @param webUrl - the web app's public URL
 * @param asOf - when the cards were read, an ISO timestamp; the rating hints count from here
 * @returns the structured result
 */
export function toDueCards(
  due: DueCards,
  deck: Deck | null,
  webUrl: string,
  asOf: string,
): GetDueCardsOutput {
  return {
    deck:
      deck === null
        ? null
        : {
            id: deck.id,
            title: deck.title,
            url: deckUrl(webUrl, deck.id),
            cardCount: deck.cardCount,
          },
    cards: due.cards,
    totalDue: due.totalDue,
    libraryUrl: libraryUrl(webUrl),
    asOf,
  };
}

/** How the AI should run the quiz (spec 4.5): the answer is never shown first. */
const QUIZ_RULES =
  'Quiz the user one card at a time: ask the "ask" side, wait for their answer, and never show the answer before they reply. Judge their own words fairly and explain a mistake, then record it with submit_review, passing the card’s deck id, card id and direction, a rating (again = forgot, hard, good or easy) and a new idempotencyKey.';

const dueLabel = (count: number): string =>
  count === 1 ? '1 card is due' : `${count} cards are due`;

/**
 * One due card on one line, with the ids `submit_review` takes.
 * @param card - the card
 * @param number - its place in the session
 * @returns `N. [state] in "Deck" (deck id: …, card id: …, direction: …) ask: … | answer: … | extra: …`
 */
function describeSessionCard(card: DueCard, number: number): string {
  const parts = [
    `${number}. [${card.state}] in "${card.deckTitle}" (deck id: ${card.deckId}, card id: ${card.cardId}, direction: ${card.direction}) ask: ${card.prompt}`,
    `answer: ${card.answer}`,
  ];
  if (card.extra !== '') parts.push(`extra: ${card.extra}`);
  return parts.join(' | ');
}

/** What to tell the AI when nothing is due, so it can say why and offer a next step. */
function formatNothingDue(output: GetDueCardsOutput): string {
  const { deck } = output;
  if (deck === null)
    return 'Nothing is due right now in any deck: every card is scheduled for later, or today’s new-card limit is reached. Tell the user they are done for now; offer to add new cards with add_cards.';
  if (deck.cardCount === 0)
    return `The deck "${deck.title}" (id: ${deck.id}) has no cards yet, so there is nothing to study. Offer to add some with add_cards. ${deck.url}`;
  return `Nothing is due right now in "${deck.title}" (id: ${deck.id}): every card is scheduled for later, or today’s new-card limit is reached. Tell the user they are done with this deck for now; get_due_cards without a deck id looks at every deck.`;
}

/**
 * The same result written for the AI: how many cards are due, one line per
 * card with the ids `submit_review` needs, and how to run the quiz. The
 * answers are here because the AI judges the user's reply; the view keeps
 * them hidden until the user asks.
 * @param output - the structured result
 * @returns compact text, with guidance when nothing is due
 */
export function formatDueCards(output: GetDueCardsOutput): string {
  if (output.cards.length === 0) return formatNothingDue(output);
  const scope = output.deck === null ? 'across all decks' : `in "${output.deck.title}"`;
  const shown =
    output.cards.length < output.totalDue
      ? `here are the first ${output.cards.length}, in session order`
      : 'in session order';
  const lines = [
    `${dueLabel(output.totalDue)} now ${scope}; ${shown}:`,
    ...output.cards.map((card, index) => describeSessionCard(card, index + 1)),
    QUIZ_RULES,
  ];
  if (output.cards.length < output.totalDue)
    lines.push(
      `${output.totalDue - output.cards.length} more are due after these: when these are recorded, call get_due_cards again for the next ones.`,
    );
  return lines.join('\n');
}
