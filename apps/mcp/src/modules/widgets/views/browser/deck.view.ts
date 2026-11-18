import { type GetDeckOutput, GetDeckOutputSchema } from '@deck-club/contracts';
import { MORE_CARDS_ACTION, renderDeck } from '../deck-markup.js';
import { showMoreCards } from './deck-pages.js';
import { startView } from './view-runtime.js';

/**
 * The `get_deck` view: one deck and its cards as ruled index cards in the
 * chat. "Show more cards" reads the next page through the host.
 */
startView<GetDeckOutput>({
  name: 'deck-club-deck',
  schema: GetDeckOutputSchema,
  render: renderDeck,
  messages: {
    toolFailed: 'Deck Club could not open this deck. The assistant has the reason.',
    unreadable: 'Deck Club sent a deck this view could not read. Ask again in a moment.',
  },
  actions: { [MORE_CARDS_ACTION]: showMoreCards },
});
