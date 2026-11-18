import { DeleteCardsOutputSchema } from '@deck-club/contracts';
import {
  ADD_BACK_ACTION,
  ADD_CARDS_TOOL,
  addBackArguments,
  type CardsDeletedView,
  readAddedBack,
  renderCardsDeleted,
} from '../cards-deleted-markup.js';
import { askToAddBack } from '../chat-messages.js';
import { callThroughHost, startView, type ViewContext } from './view-runtime.js';

/**
 * "Add them back as new cards": calls `add_cards` through the host with the
 * deleted cards' content and a key made from their ids, so a second click
 * never adds them twice. A host that does not relay tool calls from views
 * gets the request as a chat message; the assistant has the cards in full.
 */
async function addBack(_deckId: string, view: ViewContext<CardsDeletedView>): Promise<void> {
  const shown = view.current();
  if (shown === undefined) return;
  const result = await callThroughHost(
    view.app,
    { name: ADD_CARDS_TOOL, arguments: addBackArguments(shown) },
    askToAddBack(shown.deck.title, shown.deleted.length),
  );
  if (result === null) return view.render(shown);
  const added = readAddedBack(result);
  if (added === null) {
    view.notice('The cards could not be added back. Ask the assistant to add them again.');
    return;
  }
  view.render({ ...shown, addedBack: added.addedCount });
}

/** The `delete_cards` view: the deleted cards, and the way back. */
startView<CardsDeletedView>({
  name: 'deck-club-cards-deleted',
  schema: DeleteCardsOutputSchema,
  render: renderCardsDeleted,
  messages: {
    toolFailed: 'Deck Club did not delete the cards. The assistant has the reason.',
    unreadable:
      'Deck Club sent a result this view could not read. Ask the assistant what was deleted.',
  },
  actions: { [ADD_BACK_ACTION]: addBack },
});
