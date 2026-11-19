import {
  type DeckDueToday,
  type GetStatsOutput,
  GetStatsOutputSchema,
  type McpToolName,
  WEAK_CARD_RULE,
  type WeakCard,
} from '@deck-club/contracts';
import { ASK_FOR_DUE_QUIZ, askForHelpWithCard, askForQuiz } from './chat-messages.js';
import { actionButton, chip, countLabel, deckChip, pageHeader } from './components.js';
import { deckAccent } from './deck-accent.js';
import { escapeHtml } from './escape-html.js';
import { readToolOutput, type ToolResultLike } from './tool-output.js';

/** The view action that reads the stats again; its value is unused. */
export const REFRESH_ACTION = 'refresh';

/** The server tool the view calls, through the host, to refresh. */
export const STATS_TOOL: McpToolName = 'get_stats';

/** One number on a tile: what it is, how much, and a word about it. */
type StatTile = {
  label: string;
  value: string;
  unit: string;
  note: string;
  /** The tile's pastel fill. */
  tone: 'peach' | 'mint' | 'sky' | 'lilac';
  /** Extra markup under the number, e.g. today's progress bar. */
  extra?: string;
};

/** Encourages, never scolds: a streak at risk is an invitation. */
const statsLead = (output: GetStatsOutput): string => {
  if (output.streakDays === 0) return 'Review a card today to start a streak.';
  const streak = `${output.streakDays}-day streak`;
  return output.reviewedToday > 0
    ? `A ${streak}, and today counts.`
    : `Study today to keep your ${streak}.`;
};

const stillDue = (output: GetStatsOutput): number =>
  output.dueToday.dueReviews + output.dueToday.newCards;

/** Today's reviews done against what is left, as an accessible progress bar. */
const progressBar = (output: GetStatsOutput): string => {
  const done = output.reviewedToday;
  const total = done + stillDue(output);
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return `<div class="progress" role="progressbar" aria-label="Today’s progress" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}" aria-valuetext="${done} of ${total} done"><span class="progress-fill" style="width: ${percent}%"></span></div>`;
};

const tiles = (output: GetStatsOutput): StatTile[] => {
  const left = stillDue(output);
  return [
    {
      label: 'Streak',
      value: String(output.streakDays),
      unit: output.streakDays === 1 ? 'day' : 'days',
      note: output.reviewedToday > 0 ? 'Studied today' : 'Not yet today',
      tone: 'peach',
    },
    {
      label: 'Today',
      value: String(output.reviewedToday),
      unit: 'done',
      note: left === 0 ? 'Nothing left today' : `${countLabel(left, 'card')} left`,
      tone: 'mint',
      extra: progressBar(output),
    },
    {
      label: 'Retention',
      value: output.retention30d === null ? '–' : `${Math.round(output.retention30d * 100)}%`,
      unit: '',
      note: output.retention30d === null ? 'Not measured yet' : 'remembered over the last 30 days',
      tone: 'sky',
    },
    {
      label: 'Total',
      value: String(output.totalReviews),
      unit: output.totalReviews === 1 ? 'review' : 'reviews',
      note: 'since you started',
      tone: 'lilac',
    },
  ];
};

const statTile = (tile: StatTile): string => `
      <li class="stat stat-${tile.tone}">
        <p class="stat-label">${tile.label}</p>
        <p class="stat-value">${escapeHtml(tile.value)}${tile.unit === '' ? '' : ` <span class="stat-unit">${tile.unit}</span>`}</p>
        ${tile.extra ?? ''}
        <p class="stat-note">${escapeHtml(tile.note)}</p>
      </li>`;

const deckDueRow = (deck: DeckDueToday): string => `
        <li class="due-deck">
          ${deckChip(deck.title, deckAccent(deck.id))}
          <span class="due-counts">${countLabel(deck.dueReviews, 'review')} · ${deck.newCards} new</span>
          ${actionButton({ label: 'Quiz me', action: 'ask', value: askForQuiz(deck.title), variant: 'secondary', accessibleName: `Quiz me on ${deck.title}` })}
        </li>`;

const dueSection = (output: GetStatsOutput): string => {
  const body =
    output.decksDueToday.length === 0
      ? '<p class="lead">Nothing left for today. Each card comes back when it is time to review it.</p>'
      : `<ul class="due-list">${output.decksDueToday.map(deckDueRow).join('')}
      </ul>`;
  return `
    <section class="stats-section" aria-labelledby="due-title">
      <h2 id="due-title">Still due today</h2>
      ${body}
    </section>`;
};

const weakCardItem = (card: WeakCard): string => {
  const extra =
    card.extra === '' ? '' : `<p class="card-extra" dir="auto">${escapeHtml(card.extra)}</p>`;
  const chips = [
    deckChip(card.deckTitle, deckAccent(card.deckId)),
    chip(`Forgotten ${card.forgotten}×`, 'rose', `Forgotten ${card.forgotten} times`),
    ...(card.direction === 'reverse'
      ? [chip('Back to front', 'paper', 'Asked from the back of the card')]
      : []),
  ];
  return `
      <li class="card">
        <div class="card-sides">
          <div class="ruled card-side">
            <span class="card-label">Question</span>
            <p class="card-front" dir="auto">${escapeHtml(card.prompt)}</p>
          </div>
          <div class="ruled card-side">
            <span class="card-label">Answer</span>
            <p class="card-back" dir="auto">${escapeHtml(card.answer)}</p>
            ${extra}
          </div>
        </div>
        <p class="card-meta">${chips.join('')}</p>
        <div class="actions card-actions">${actionButton({ label: 'Help me remember it', action: 'ask', value: askForHelpWithCard(card.prompt), variant: 'secondary', accessibleName: `Help me remember ${card.prompt}` })}</div>
      </li>`;
};

const weakSection = (output: GetStatsOutput): string => {
  const rule = `Forgotten at least ${WEAK_CARD_RULE.minForgotten} times in the last ${WEAK_CARD_RULE.windowDays} days.`;
  const body =
    output.weakCards.length === 0
      ? `<p class="lead">None right now: no card was forgotten ${WEAK_CARD_RULE.minForgotten} times in the last ${WEAK_CARD_RULE.windowDays} days.</p>`
      : `<p class="lead">${rule}</p>
      <ol class="card-list">${output.weakCards.map(weakCardItem).join('')}
      </ol>`;
  return `
    <section class="stats-section" aria-labelledby="weak-title">
      <h2 id="weak-title">Cards you keep forgetting</h2>
      ${body}
    </section>`;
};

const footer = (output: GetStatsOutput): string => {
  const quiz =
    stillDue(output) === 0
      ? ''
      : actionButton({ label: 'Quiz me on my due cards', action: 'ask', value: ASK_FOR_DUE_QUIZ });
  return `
    <div class="actions footer">
      ${quiz}
      ${actionButton({ label: 'Refresh', action: REFRESH_ACTION, value: STATS_TOOL, variant: quiz === '' ? 'primary' : 'secondary', focus: true })}
      ${actionButton({ label: 'Open Deck Club', action: 'open', value: output.libraryUrl, variant: 'secondary' })}
    </div>`;
};

/**
 * The user's progress as the chat shows it: four tiles (streak, today with
 * a progress bar, 30-day retention, total reviews), what is still due today
 * per deck with a quiz one press away, and the cards they keep forgetting,
 * each with a way to ask the assistant for help. Encouraging, never
 * scolding (spec 1: a fast daily habit).
 * @param output - the `get_stats` result
 * @returns the HTML of the view's body
 */
export function renderStats(output: GetStatsOutput): string {
  return `${pageHeader({ title: 'Your progress', lead: statsLead(output) })}
    <ul class="stat-grid">${tiles(output).map(statTile).join('')}
    </ul>${dueSection(output)}${weakSection(output)}${footer(output)}`;
}

/**
 * Reads the stats the view fetched itself.
 * @param result - the tool result the host relayed
 * @returns the stats, or null when the tool refused or the result breaks the contract
 */
export function readStats(result: ToolResultLike): GetStatsOutput | null {
  return readToolOutput(GetStatsOutputSchema, result);
}
