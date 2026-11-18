import { type ListDecksOutput, ListDecksOutputSchema } from '@deck-club/contracts';
import { renderDeckLibrary } from '../deck-library-markup.js';
import { startView } from './view-runtime.js';

/**
 * The `list_decks` view: the user's deck library in the chat. Its buttons
 * open a deck in Deck Club or ask the assistant for cards; both are handled
 * by the shared runtime.
 */
startView<ListDecksOutput>({
  name: 'deck-club-deck-library',
  schema: ListDecksOutputSchema,
  render: renderDeckLibrary,
  messages: {
    toolFailed: 'Deck Club could not list the decks. The assistant has the reason.',
    unreadable: 'Deck Club sent a deck list this view could not read. Ask again in a moment.',
  },
});
