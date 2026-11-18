import type { AddCardsOutput } from '@deck-club/contracts';
import { indexCard } from './card-components.js';
import { askForCards, askForQuiz } from './chat-messages.js';
import { actionButton, countLabel, pageHeader } from './components.js';
import { deckAccent } from './deck-accent.js';
import { MORE_CARDS_ACTION } from './deck-markup.js';

const addedLead = (output: AddCardsOutput): string => {
  const { deck } = output;
  return `In ${deck.title} · ${deck.language.toUpperCase()} · now ${countLabel(deck.cardCount, 'card')}`;
};

/** "Showing 25 of the 100 new cards", while some of them are not on screen yet. */
const pageStatus = (output: AddCardsOutput): string => {
  const shown = Math.min(output.cards.length, output.addedCount);
  return shown >= output.addedCount
    ? ''
    : `<p class="lead page-status">Showing ${shown} of the ${output.addedCount} new cards</p>`;
};

const nextSteps = (output: AddCardsOutput): string => {
  const { deck, nextCursor } = output;
  const more =
    nextCursor === null
      ? ''
      : actionButton({ label: 'Show more cards', action: MORE_CARDS_ACTION, value: nextCursor });
  return `
    <section class="panel" aria-labelledby="cards-added-next-title">
      <h2 id="cards-added-next-title">Next: learn them</h2>
      <p class="lead">They are in the deck and ready to study. Something off? Ask the assistant to fix or remove a card.</p>
      <div class="actions">
        ${more}
        ${actionButton({ label: 'Quiz me on this deck', action: 'ask', value: askForQuiz(deck.title), variant: more === '' ? 'primary' : 'secondary' })}
        ${actionButton({ label: 'Add 10 more', action: 'ask', value: askForCards(deck.title), variant: 'secondary' })}
        ${actionButton({ label: 'Open in Deck Club', action: 'open', value: deck.url, variant: 'secondary', accessibleName: `Open ${deck.title} in Deck Club` })}
      </div>
    </section>`;
};

/**
 * The cards `add_cards` just wrote, as the chat shows them: "N cards added"
 * on the deck's own pastel, each new card as a ruled index card numbered
 * where it sits in the deck (with its "Added by Claude" chip), and the next
 * steps: read the rest of a large batch, study, add more, or open the deck.
 * @param output - the `add_cards` result, or it with more pages appended
 * @returns the HTML of the view's body
 */
export function renderCardsAdded(output: AddCardsOutput): string {
  const header = pageHeader({
    title: `${countLabel(output.addedCount, 'card')} added`,
    lead: addedLead(output),
    accent: deckAccent(output.deck.id),
  });
  return `${header}
    <ol class="card-list" start="${output.firstCardNumber}">${output.cards.map((card) => indexCard(card)).join('')}
    </ol>
    ${pageStatus(output)}${nextSteps(output)}`;
}
