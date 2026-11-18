import { type GetDeckOutput, GetDeckOutputSchema } from '@deck-club/contracts';
import { askForMoreCards } from '../chat-messages.js';
import {
  appendPage,
  DECK_TOOL,
  MORE_CARDS_ACTION,
  readNextPage,
  renderDeck,
} from '../deck-markup.js';
import { callThroughHost, startView, type ViewContext } from './view-runtime.js';

/**
 * "Show more cards": fetches the next page by calling `get_deck` on the
 * server through the host, without a round trip through the model, and adds
 * it below the cards on screen. A host that does not relay tool calls from
 * views gets the request as a chat message instead.
 */
async function showMoreCards(cursor: string, view: ViewContext<GetDeckOutput>): Promise<void> {
  const shown = view.current();
  if (shown === undefined) return;
  const result = await callThroughHost(
    view.app,
    { name: DECK_TOOL, arguments: { deckId: shown.deck.id, cursor } },
    askForMoreCards(shown.deck.title),
  );
  if (result === null) return view.render(shown);
  const next = readNextPage(result);
  if (next === null) {
    view.notice('The next cards could not be loaded. Ask the assistant to show them.');
    return;
  }
  view.render(appendPage(shown, next));
}

/** The `get_deck` view: one deck and its cards as ruled index cards in the chat. */
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
