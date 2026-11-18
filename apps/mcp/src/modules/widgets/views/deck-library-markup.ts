import type { DeckSummary, ListDecksOutput } from '@deck-club/contracts';
import { ASK_TO_CREATE_DECK, askForCards } from './chat-messages.js';
import { actionButton, countLabel, emptyState, pageHeader } from './components.js';
import { deckTile } from './deck-components.js';

const libraryTile = (deck: DeckSummary): string =>
  deckTile(deck, {
    actions: [
      actionButton({
        label: 'Open deck',
        action: 'open',
        value: deck.url,
        accessibleName: `Open ${deck.title} in Deck Club`,
      }),
      actionButton({
        label: 'Add cards',
        action: 'ask',
        value: askForCards(deck.title),
        variant: 'secondary',
        accessibleName: `Ask for cards for ${deck.title}`,
      }),
    ].join(''),
  });

const libraryLead = (library: ListDecksOutput): string => {
  if (library.deckCount === 0) return 'Nothing here yet.';
  const cards = library.decks.reduce((total, deck) => total + deck.cardCount, 0);
  return `${countLabel(library.deckCount, 'deck')} · ${countLabel(cards, 'card')}`;
};

/**
 * The deck library as the chat shows it: index cards with their pastel tab,
 * card count and language, exactly like the web app's library.
 * @param library - the `list_decks` result
 * @returns the HTML of the view's body
 */
export function renderDeckLibrary(library: ListDecksOutput): string {
  const body =
    library.deckCount === 0
      ? emptyState(
          'No decks yet',
          'Ask for a deck and the cards to fill it.',
          actionButton({ label: 'Make my first deck', action: 'ask', value: ASK_TO_CREATE_DECK }),
        )
      : `
    <ul class="deck-grid">${library.decks.map(libraryTile).join('')}
    </ul>`;
  return `${pageHeader({ title: 'Your decks', lead: libraryLead(library) })}${body}
    <p class="footer">
      ${actionButton({ label: 'Open Deck Club', action: 'open', value: library.libraryUrl, variant: 'secondary' })}
    </p>`;
}
