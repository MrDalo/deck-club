import {
  type GetStatsOutput,
  type StudyStats,
  type Today,
  WEAK_CARD_RULE,
  type WeakCard,
} from '@deck-club/contracts';
import { countLabel } from '../../../common/text/count-label.js';
import { deckUrl, libraryUrl } from '../../../common/web/web-links.js';

/**
 * Turns the API's stats and today's workload into the `get_stats` result:
 * the data its stats view renders and the AI reads as structured content.
 * Only the decks with something still due today are listed.
 * @param stats - the API's stats
 * @param today - the API's Today dashboard
 * @param webUrl - the web app's public URL
 * @returns the structured result
 */
export function toStats(stats: StudyStats, today: Today, webUrl: string): GetStatsOutput {
  return {
    ...stats,
    dueToday: today.totals,
    decksDueToday: today.decks
      .filter((deck) => deck.dueReviews + deck.newCards > 0)
      .map((deck) => ({
        id: deck.deckId,
        title: deck.title,
        url: deckUrl(webUrl, deck.deckId),
        dueReviews: deck.dueReviews,
        newCards: deck.newCards,
      })),
    libraryUrl: libraryUrl(webUrl),
  };
}

/** The streak, and whether today still has to count for it (spec 6: a day not studied yet does not break it). */
function streakLine(output: GetStatsOutput): string {
  if (output.streakDays === 0) return 'Streak: none yet. A review today starts one.';
  const streak = `Streak: ${countLabel(output.streakDays, 'day')} in a row`;
  return output.reviewedToday > 0
    ? `${streak}, including today.`
    : `${streak}. Not studied yet today: one review today keeps it going.`;
}

function todayLines(output: GetStatsOutput): string[] {
  const done = `Today: ${countLabel(output.reviewedToday, 'review')} done`;
  const { dueReviews, newCards } = output.dueToday;
  if (dueReviews + newCards === 0) return [`${done}; nothing more is due today.`];
  return [
    `${done}; ${countLabel(dueReviews + newCards, 'card')} still due (${countLabel(dueReviews, 'review')}, ${newCards} new):`,
    ...output.decksDueToday.map(
      (deck) =>
        `- "${deck.title}" (id: ${deck.id}): ${countLabel(deck.dueReviews, 'review')}, ${deck.newCards} new`,
    ),
  ];
}

const retentionLine = (output: GetStatsOutput): string =>
  output.retention30d === null
    ? 'Retention (last 30 days): not measured yet; no learned card was reviewed in the last 30 days.'
    : `Retention (last 30 days): ${Math.round(output.retention30d * 100)}% of reviews of learned cards were remembered.`;

const weakCardLine = (card: WeakCard, number: number): string => {
  const parts = [
    `${number}. in "${card.deckTitle}" (deck id: ${card.deckId}, card id: ${card.cardId}, direction: ${card.direction}) ask: ${card.prompt}`,
    `answer: ${card.answer}`,
  ];
  if (card.extra !== '') parts.push(`extra: ${card.extra}`);
  parts.push(`forgotten ${countLabel(card.forgotten, 'time')}, last ${card.lastForgottenAt}`);
  return parts.join(' | ');
};

const WEAK_RULE_WORDS = `forgotten at least ${WEAK_CARD_RULE.minForgotten} times in the last ${WEAK_CARD_RULE.windowDays} days`;

function weakCardLines(output: GetStatsOutput): string[] {
  if (output.weakCards.length === 0) return [`Weak cards: none; no card was ${WEAK_RULE_WORDS}.`];
  return [
    `Weak cards (${WEAK_RULE_WORDS}), most forgotten first:`,
    ...output.weakCards.map((card, index) => weakCardLine(card, index + 1)),
    'To help: explain what makes each one hard to remember, quiz the user on them when they are due, or, once the user agrees, make a card clearer with update_card (one fact per card, a short answer).',
  ];
}

/**
 * The same result written for the AI: the streak and whether today still
 * counts for it, today's progress with what is left per deck, retention,
 * the total, and the weak cards with the ids to act on them.
 * @param output - the structured result
 * @returns compact text
 */
export function formatStats(output: GetStatsOutput): string {
  return [
    streakLine(output),
    ...todayLines(output),
    retentionLine(output),
    `Total reviews: ${output.totalReviews}.`,
    ...weakCardLines(output),
  ].join('\n');
}
