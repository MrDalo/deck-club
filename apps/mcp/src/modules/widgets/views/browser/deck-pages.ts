import type { GetDeckOutput } from '@deck-club/contracts';
import { askForMoreCards } from '../chat-messages.js';
import { appendPage, DECK_TOOL, readNextPage } from '../deck-markup.js';
import { callThroughHost, type ViewContext } from './view-runtime.js';

/**
 * "Show more cards", for every view that shows a deck page (`get_deck`, and
 * `add_cards`, whose result is a page too): fetches the next page by calling
 * `get_deck` on the server through the host, without a round trip through
 * the model, and adds it below the cards on screen. A host that does not
 * relay tool calls from views gets the request as a chat message instead.
 * @param cursor - the page's `nextCursor`, from the button
 * @param view - the view showing the page
 */
export async function showMoreCards<Shown extends GetDeckOutput>(
  cursor: string,
  view: ViewContext<Shown>,
): Promise<void> {
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
