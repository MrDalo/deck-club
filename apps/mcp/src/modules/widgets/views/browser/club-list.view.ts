import { type ListClubsOutput, ListClubsOutputSchema } from '@deck-club/contracts';
import { renderClubList } from '../club-list-markup.js';
import { startView } from './view-runtime.js';

/**
 * The `list_clubs` view: the user's clubs, their role in each and the decks
 * each club shares. Its buttons open a deck or Deck Club; both are handled
 * by the shared runtime.
 */
startView<ListClubsOutput>({
  name: 'deck-club-club-list',
  schema: ListClubsOutputSchema,
  render: renderClubList,
  messages: {
    toolFailed: 'Deck Club could not list your clubs. The assistant has the reason.',
    unreadable: 'Deck Club sent a club list this view could not read. Ask again in a moment.',
  },
});
