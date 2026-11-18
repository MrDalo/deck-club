import { type UpdateCardOutput, UpdateCardOutputSchema } from '@deck-club/contracts';
import {
  readUpdatedCard,
  renderCardUpdated,
  UNDO_CHANGE_ACTION,
  UPDATE_CARD_TOOL,
  undoArguments,
} from '../card-updated-markup.js';
import { askToUndoCardChange } from '../chat-messages.js';
import { callThroughHost, startView, type ViewContext } from './view-runtime.js';

/**
 * "Undo this change": calls `update_card` through the host with the old
 * values of the changed fields, without a round trip through the model, and
 * shows the card as it is after the undo (which can itself be undone). A
 * host that does not relay tool calls from views gets the request as a chat
 * message instead; the assistant has the old values in its reply.
 */
async function undoChange(_cardId: string, view: ViewContext<UpdateCardOutput>): Promise<void> {
  const shown = view.current();
  if (shown === undefined) return;
  const result = await callThroughHost(
    view.app,
    { name: UPDATE_CARD_TOOL, arguments: undoArguments(shown) },
    askToUndoCardChange(shown.card.front),
  );
  if (result === null) return view.render(shown);
  const undone = readUpdatedCard(result);
  if (undone === null) {
    view.notice('The change could not be undone. Ask the assistant to change the card back.');
    return;
  }
  view.render(undone);
}

/** The `update_card` view: the edited card, what changed, and a way to undo it. */
startView<UpdateCardOutput>({
  name: 'deck-club-card-updated',
  schema: UpdateCardOutputSchema,
  render: renderCardUpdated,
  messages: {
    toolFailed: 'Deck Club did not update the card. The assistant has the reason.',
    unreadable: 'Deck Club sent a card this view could not read. Ask the assistant to show it.',
  },
  actions: { [UNDO_CHANGE_ACTION]: undoChange },
});
