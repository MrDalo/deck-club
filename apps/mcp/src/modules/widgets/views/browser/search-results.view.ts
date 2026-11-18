import { type SearchCardsOutput, SearchCardsOutputSchema } from '@deck-club/contracts';
import { askToSearch } from '../chat-messages.js';
import {
  nextSearchArguments,
  readSearchResults,
  renderSearchResults,
  SEARCH_ACTION,
  SEARCH_TOOL,
} from '../search-results-markup.js';
import { callThroughHost, startView, type ViewContext } from './view-runtime.js';

/**
 * The search box: runs `search_cards` again with the typed words, in the
 * same scope, through the host, and shows the new results in place. A host
 * that does not relay tool calls gets the search as a chat message instead.
 */
async function searchAgain(query: string, view: ViewContext<SearchCardsOutput>): Promise<void> {
  const shown = view.current();
  if (shown === undefined) return;
  const result = await callThroughHost(
    view.app,
    { name: SEARCH_TOOL, arguments: nextSearchArguments(shown, query) },
    askToSearch(query),
  );
  if (result === null) return view.render(shown);
  const next = readSearchResults(result);
  if (next === null) return view.notice('That search did not work. Ask the assistant to run it.');
  view.render(next);
}

/** The `search_cards` view: matching cards with their deck and the words marked. */
startView<SearchCardsOutput>({
  name: 'deck-club-search-results',
  schema: SearchCardsOutputSchema,
  render: renderSearchResults,
  messages: {
    toolFailed: 'Deck Club could not search the cards. The assistant has the reason.',
    unreadable: 'Deck Club sent search results this view could not read. Ask again in a moment.',
  },
  actions: { [SEARCH_ACTION]: searchAgain },
});
