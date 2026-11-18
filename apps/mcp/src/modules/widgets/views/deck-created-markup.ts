import type { CreateDeckOutput } from '@deck-club/contracts';
import { askForCards, askForCardsFromNotes } from './chat-messages.js';
import { actionButton, chip, pageHeader } from './components.js';
import { deckAccent } from './deck-accent.js';
import { deckTile } from './deck-components.js';

const VISIBILITY_LABELS: Readonly<Record<CreateDeckOutput['deck']['visibility'], string>> = {
  private: 'Private',
  unlisted: 'Unlisted',
  public: 'Public',
};

const visibilityLead = (output: CreateDeckOutput): string =>
  output.deck.visibility === 'private'
    ? 'It is private: only you can see it until you share it.'
    : `It is ${VISIBILITY_LABELS[output.deck.visibility].toLowerCase()}.`;

/**
 * A new deck as the chat shows it: the heading on the deck's own pastel,
 * the deck as the tile it now is in the library (with its tags and
 * visibility), and the next step — a new deck is empty, so the view's main
 * action is to fill it.
 * @param output - the `create_deck` result
 * @returns the HTML of the view's body
 */
export function renderDeckCreated(output: CreateDeckOutput): string {
  const { deck } = output;
  const chips = [
    chip(
      VISIBILITY_LABELS[deck.visibility],
      'paper',
      `Visibility: ${VISIBILITY_LABELS[deck.visibility]}`,
    ),
    ...deck.tags.map((tag) => chip(tag, 'paper', `Tag: ${tag}`)),
  ];
  const tile = deckTile(deck, {
    extraChips: chips,
    actions: actionButton({
      label: 'Open deck',
      action: 'open',
      value: deck.url,
      variant: 'secondary',
      accessibleName: `Open ${deck.title} in Deck Club`,
    }),
  });
  return `${pageHeader({ title: 'Deck created', lead: visibilityLead(output), accent: deckAccent(deck.id) })}
    <ul class="deck-grid deck-grid-single">${tile}
    </ul>
    <section class="panel" aria-labelledby="next-step-title">
      <h2 id="next-step-title">Next: fill it with cards</h2>
      <p class="lead">Ask the assistant to write them, or to turn your own notes into cards.</p>
      <div class="actions">
        ${actionButton({ label: 'Add 10 cards', action: 'ask', value: askForCards(deck.title) })}
        ${actionButton({ label: 'Use my notes', action: 'ask', value: askForCardsFromNotes(deck.title), variant: 'secondary' })}
        ${actionButton({ label: 'See all decks', action: 'open', value: output.libraryUrl, variant: 'secondary' })}
      </div>
    </section>`;
}
