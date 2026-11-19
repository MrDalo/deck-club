import { GetDueCardsOutputSchema, type Rating } from '@deck-club/contracts';
import type { App } from '@modelcontextprotocol/ext-apps';
import { askForNextDueCards, askToRate } from '../chat-messages.js';
import { renderStudySession } from '../study-session-markup.js';
import {
  DUE_CARDS_TOOL,
  NEXT_CARDS_ACTION,
  nextCardsArguments,
  parseRateValue,
  RATE_ACTION,
  ratingsContext,
  readDueCards,
  readReview,
  reviewArguments,
  type StudySession,
  SUBMIT_REVIEW_TOOL,
  withReview,
} from '../study-session-state.js';
import { callThroughHost, startView, type ViewContext } from './view-runtime.js';

/**
 * Tells the assistant which cards the user rated here, so a quiz in the chat
 * neither asks them again nor records them twice. Hosts that take no model
 * context simply do not get it; the ratings are recorded either way.
 */
async function shareRatings(app: App, session: StudySession): Promise<void> {
  const text = ratingsContext(session);
  if (text === null || app.getHostCapabilities()?.updateModelContext === undefined) return;
  try {
    await app.updateModelContext({ content: [{ type: 'text', text }] });
  } catch (error) {
    console.error('Deck Club view could not share its ratings with the assistant', error);
  }
}

/**
 * A rating button: records the rating with `submit_review` through the host,
 * without a round trip through the model, and shows when the card comes
 * back. A host that does not relay tool calls from views gets the rating as
 * a chat message instead, and the assistant records it.
 */
async function rate(value: string, view: ViewContext<StudySession>): Promise<void> {
  const shown = view.current();
  const choice = parseRateValue(value);
  if (shown === undefined || choice === null) return;
  const call = reviewArguments(shown, choice.index, choice.rating);
  const card = shown.cards[choice.index];
  if (call === null || card === undefined) return;
  const result = await callThroughHost(
    view.app,
    { name: SUBMIT_REVIEW_TOOL, arguments: call },
    askToRate(card.prompt, choice.rating satisfies Rating),
  );
  if (result === null) return view.render(shown);
  const review = readReview(result);
  const next = review === null ? null : withReview(shown, choice.index, review);
  if (next === null) {
    view.notice('That rating was not recorded. Try again, or tell the assistant how you did.');
    return;
  }
  view.render(next);
  await shareRatings(view.app, next);
}

/** "Next cards": reads the cards due after this session with `get_due_cards` through the host. */
async function nextCards(_value: string, view: ViewContext<StudySession>): Promise<void> {
  const shown = view.current();
  if (shown === undefined) return;
  const result = await callThroughHost(
    view.app,
    { name: DUE_CARDS_TOOL, arguments: nextCardsArguments(shown) },
    askForNextDueCards(shown.deck?.title ?? null),
  );
  if (result === null) return view.render(shown);
  const session = readDueCards(result);
  if (session === null) {
    view.notice('The next cards could not be loaded. Ask the assistant for them.');
    return;
  }
  view.render(session);
}

/**
 * The `get_due_cards` view: the cards due now, each question on a ruled
 * index card with its answer face down until the user opens it, the four
 * ratings under each answer, and a way to start the quiz in the chat.
 */
startView<StudySession>({
  name: 'deck-club-study-session',
  schema: GetDueCardsOutputSchema,
  render: renderStudySession,
  messages: {
    toolFailed: 'Deck Club could not load your due cards. The assistant has the reason.',
    unreadable: 'Deck Club sent cards this view could not read. Ask again in a moment.',
  },
  actions: { [RATE_ACTION]: rate, [NEXT_CARDS_ACTION]: nextCards },
});
