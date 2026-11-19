import {
  type DueCard,
  type Rating,
  RATINGS,
  type StudyStateName,
  type SubmitReviewOutput,
} from '@deck-club/contracts';
import { timeUntil } from '../../../common/time/time-until.js';
import { ASK_FOR_DUE_QUIZ, askForCards, askForQuiz } from './chat-messages.js';
import {
  actionButton,
  chip,
  type ChipTone,
  countLabel,
  deckChip,
  emptyState,
  FOCUS_ATTRIBUTE,
  pageHeader,
} from './components.js';
import { deckAccent } from './deck-accent.js';
import { escapeHtml } from './escape-html.js';
import {
  NEXT_CARDS_ACTION,
  RATE_ACTION,
  ratedCount,
  rateValue,
  sessionId,
  type StudySession,
} from './study-session-state.js';

const STATE_LABELS: Readonly<Record<StudyStateName, string>> = {
  new: 'New',
  learning: 'Learning',
  review: 'Review',
  relearning: 'Relearning',
};

/** The four ratings as the buttons say them, in keyboard order, each in its own pastel. */
const RATING_LOOKS: Readonly<Record<Rating, { label: string; tone: ChipTone }>> = {
  again: { label: 'Again', tone: 'rose' },
  hard: { label: 'Hard', tone: 'peach' },
  good: { label: 'Good', tone: 'mint' },
  easy: { label: 'Easy', tone: 'sky' },
};

/** What one card of the session is drawn with. */
type CardContext = {
  session: StudySession;
  index: number;
  showDeck: boolean;
  /** Whether this card takes the focus after a rating (the first one left to rate). */
  focus: boolean;
};

const sessionLead = (session: StudySession): string => {
  const scope = session.deck === null ? 'Across your decks' : `In ${session.deck.title}`;
  if (session.cards.length === 0) return scope;
  return session.cards.length < session.totalDue
    ? `${scope} · the next ${session.cards.length}, in review order`
    : `${scope} · in review order`;
};

const sessionHeader = (session: StudySession): string =>
  pageHeader({
    title:
      session.totalDue === 0
        ? 'Nothing to review'
        : `${countLabel(session.totalDue, 'card')} to review`,
    lead: sessionLead(session),
    ...(session.deck !== null && { accent: deckAccent(session.deck.id) }),
  });

const cardChips = (card: DueCard, showDeck: boolean): string => {
  const state = STATE_LABELS[card.state];
  const chips = [
    ...(showDeck ? [deckChip(card.deckTitle, deckAccent(card.deckId))] : []),
    chip(state, card.state === 'new' ? 'sky' : 'paper', `State: ${state}`),
    ...(card.direction === 'reverse'
      ? [chip('Back to front', 'paper', 'Asked from the back of the card')]
      : []),
  ];
  return `<p class="card-meta">${chips.join('')}</p>`;
};

/**
 * The four rating buttons under a revealed answer. Each says when the card
 * comes back with that rating, counted from when the cards were read.
 */
const ratingButtons = (context: CardContext, card: DueCard): string => {
  const titleId = `rate-${sessionId(context.session)}-${context.index}`;
  const buttons = RATINGS.map((rating) => {
    const back = timeUntil(context.session.asOf, card.nextDue[rating]);
    return `<button class="button rating-button rating-${rating}" type="button" data-action="${RATE_ACTION}" data-value="${rateValue(context.index, rating)}">${RATING_LOOKS[rating].label} <span class="rating-hint"><span class="visually-hidden">back in </span>${back}</span></button>`;
  });
  return `
            <div class="rating" role="group" aria-labelledby="${titleId}">
              <p class="rating-title" id="${titleId}">How well did you know it?</p>
              <div class="rating-buttons">${buttons.join('')}</div>
            </div>`;
};

/** What a card shows once the user rated it from the view. */
const recordedLine = (review: SubmitReviewOutput): string => {
  const look = RATING_LOOKS[review.rating];
  const done = review.replayed ? 'Already recorded' : 'Recorded';
  return `
            <p class="review-recorded">${chip(look.label, look.tone, `Rated ${look.label}`)} ${done} · back in ${timeUntil(review.asOf, review.nextDueAt)}</p>`;
};

/**
 * One due card as a ruled index card: the question is shown, the answer
 * waits face down until the user opens it, so the view never gives away
 * what the assistant is about to ask (spec 4.5). A native disclosure, so it
 * works with the keyboard and a screen reader, and without a script. Under
 * the revealed answer, the four ratings; once rated, what was recorded.
 */
const sessionCard = (context: CardContext): string => {
  const { session, index } = context;
  const card = session.cards[index];
  if (card === undefined) return '';
  const review = session.reviewed?.[index];
  const extra =
    card.extra === '' ? '' : `<p class="card-extra" dir="auto">${escapeHtml(card.extra)}</p>`;
  const focus = context.focus ? ` ${FOCUS_ATTRIBUTE}` : '';
  return `
      <li class="card">
        <div class="card-sides">
          <div class="ruled card-side">
            <span class="card-label">Question</span>
            <p class="card-front" dir="auto">${escapeHtml(card.prompt)}</p>
          </div>
          <details class="reveal" id="answer-${sessionId(session)}-${index}"${review === undefined ? '' : ' open'}>
            <summary class="reveal-toggle"${focus}><span class="reveal-show">Show answer</span><span class="reveal-hide">Hide answer</span><span class="visually-hidden"> to card ${index + 1}</span></summary>
            <div class="ruled card-side">
              <span class="card-label">Answer</span>
              <p class="card-back" dir="auto">${escapeHtml(card.answer)}</p>
              ${extra}
            </div>${review === undefined ? ratingButtons(context, card) : recordedLine(review)}
          </details>
        </div>
        ${cardChips(card, context.showDeck)}
      </li>`;
};

const nothingDue = (session: StudySession): string => {
  const { deck } = session;
  if (deck?.cardCount === 0)
    return emptyState(
      'No cards yet',
      'Ask the assistant to write some for this deck.',
      actionButton({ label: 'Add cards', action: 'ask', value: askForCards(deck.title) }),
    );
  return emptyState(
    'All caught up',
    'Nothing is due right now. Each card comes back when it is time to review it.',
    deck === null
      ? actionButton({ label: 'Open Deck Club', action: 'open', value: session.libraryUrl })
      : actionButton({ label: 'Check my other decks', action: 'ask', value: ASK_FOR_DUE_QUIZ }),
  );
};

const openInDeckClub = (session: StudySession): string =>
  actionButton({
    label: 'Open in Deck Club',
    action: 'open',
    value: session.deck?.url ?? session.libraryUrl,
    variant: 'secondary',
  });

const quizPanel = (session: StudySession): string => {
  const { deck } = session;
  return `
    <section class="panel" aria-labelledby="quiz-title">
      <h2 id="quiz-title">Rate here, or get quizzed</h2>
      <p class="lead">Show an answer and rate how well you knew it, or let the assistant ask each card in the chat and judge your answer in your own words.</p>
      <div class="actions">
        ${actionButton({ label: 'Quiz me in the chat', action: 'ask', value: deck === null ? ASK_FOR_DUE_QUIZ : askForQuiz(deck.title) })}
        ${openInDeckClub(session)}
      </div>
    </section>`;
};

const donePanel = (session: StudySession): string => {
  const waiting = session.totalDue - session.cards.length;
  const lead =
    waiting > 0
      ? `You rated ${countLabel(session.cards.length, 'card')}. ${countLabel(waiting, 'more card')} ${waiting === 1 ? 'was' : 'were'} due after these.`
      : `You rated ${countLabel(session.cards.length, 'card')}. A card you forgot comes back in a few minutes.`;
  return `
    <section class="panel" aria-labelledby="done-title">
      <h2 id="done-title">Session done</h2>
      <p class="lead">${escapeHtml(lead)}</p>
      <div class="actions">
        ${actionButton({ label: 'Next cards', action: NEXT_CARDS_ACTION, value: sessionId(session), focus: true })}
        ${openInDeckClub(session)}
      </div>
    </section>`;
};

const statusLines = (session: StudySession): string => {
  const rated = ratedCount(session);
  const waiting = session.totalDue - session.cards.length;
  const lines = [
    ...(rated > 0 && rated < session.cards.length
      ? [`${rated} of ${session.cards.length} rated.`]
      : []),
    ...(waiting > 0 && rated < session.cards.length
      ? [`${countLabel(waiting, 'more card')} due after these.`]
      : []),
  ];
  return lines.map((line) => `<p class="lead page-status">${line}</p>`).join('');
};

/**
 * The cards due now as the chat shows them: how many are due, then each
 * card's question as a ruled index card with its answer face down and,
 * once shown, the four ratings with when the card comes back. A session
 * across decks names each card's deck in its pastel; one deck colours the
 * heading. When every card is rated, the next ones are one press away.
 * @param session - the `get_due_cards` result, with the ratings made in the view
 * @returns the HTML of the view's body
 */
export function renderStudySession(session: StudySession): string {
  const header = sessionHeader(session);
  if (session.cards.length === 0) return `${header}${nothingDue(session)}`;
  const showDeck = session.deck === null;
  const focusIndex = session.cards.findIndex(
    (_card, index) => session.reviewed?.[index] === undefined,
  );
  const cards = session.cards.map((_card, index) =>
    sessionCard({ session, index, showDeck, focus: index === focusIndex }),
  );
  return `${header}
    <p class="lead session-hint">Answer each card in your head, show the answer, then rate how well you knew it.</p>
    <ol class="card-list">${cards.join('')}
    </ol>${statusLines(session)}${focusIndex === -1 ? donePanel(session) : quizPanel(session)}`;
}
