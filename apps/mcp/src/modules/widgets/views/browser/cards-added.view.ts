import { type AddCardsOutput, AddCardsOutputSchema } from '@deck-club/contracts';
import { renderCardsAdded } from '../cards-added-markup.js';
import { MORE_CARDS_ACTION } from '../deck-markup.js';
import { showMoreCards } from './deck-pages.js';
import { startView } from './view-runtime.js';

/**
 * The `add_cards` view: the cards just added as ruled index cards, and the
 * next steps. "Show more cards" reads the rest of a large batch with
 * `get_deck` through the host; the other buttons ask the assistant or open
 * Deck Club, handled by the shared runtime.
 */
startView<AddCardsOutput>({
  name: 'deck-club-cards-added',
  schema: AddCardsOutputSchema,
  render: renderCardsAdded,
  messages: {
    toolFailed:
      'Deck Club did not confirm the cards were added. The assistant has the reason and what to do next.',
    unreadable:
      'Deck Club sent cards this view could not read. Ask the assistant to show the deck.',
  },
  actions: { [MORE_CARDS_ACTION]: showMoreCards },
});
