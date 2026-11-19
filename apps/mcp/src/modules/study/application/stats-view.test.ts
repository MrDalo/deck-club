import type { StudyStats, Today } from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import { STUDY_DECK_ID, testWeakCard } from '../testing/fake-study-api.js';
import { formatStats, toStats } from './stats-view.js';

const WEB_URL = 'https://deck.club';
const FRENCH_ID = '00000000-0000-4000-8000-0000000000e2';
const CARD_ID = '00000000-0000-4000-8000-000000000001';
const STATS: StudyStats = {
  streakDays: 4,
  reviewedToday: 12,
  totalReviews: 230,
  retention30d: 0.871,
  weakCards: [],
};
const TODAY: Today = {
  decks: [
    { deckId: STUDY_DECK_ID, title: 'Spanish verbs', dueReviews: 5, newCards: 3 },
    { deckId: FRENCH_ID, title: 'French', dueReviews: 0, newCards: 0 },
  ],
  totals: { dueReviews: 5, newCards: 3 },
  reviewedToday: 12,
  streakDays: 4,
};
const text = (stats: Partial<StudyStats> = {}, today: Partial<Today> = {}): string =>
  formatStats(toStats({ ...STATS, ...stats }, { ...TODAY, ...today }, WEB_URL));

describe('toStats', () => {
  it('keeps the API’s stats and adds what is still due today, per deck with a link', () => {
    expect(toStats(STATS, TODAY, WEB_URL)).toEqual({
      ...STATS,
      dueToday: { dueReviews: 5, newCards: 3 },
      decksDueToday: [
        {
          id: STUDY_DECK_ID,
          title: 'Spanish verbs',
          url: `https://deck.club/decks/${STUDY_DECK_ID}`,
          dueReviews: 5,
          newCards: 3,
        },
      ],
      libraryUrl: 'https://deck.club/decks',
    });
  });
});

describe('formatStats', () => {
  it('gives the AI every number, with what is left per deck', () => {
    expect(text().split('\n')).toEqual([
      'Streak: 4 days in a row, including today.',
      'Today: 12 reviews done; 8 cards still due (5 reviews, 3 new):',
      `- "Spanish verbs" (id: ${STUDY_DECK_ID}): 5 reviews, 3 new`,
      'Retention (last 30 days): 87% of reviews of learned cards were remembered.',
      'Total reviews: 230.',
      'Weak cards: none; no card was forgotten at least 2 times in the last 30 days.',
    ]);
  });

  it('says a streak not yet studied for today is kept by one review today', () => {
    expect(text({ streakDays: 1, reviewedToday: 0 })).toContain(
      'Streak: 1 day in a row. Not studied yet today: one review today keeps it going.',
    );
  });

  it('says how to start a streak when there is none', () => {
    expect(text({ streakDays: 0 })).toContain('Streak: none yet. A review today starts one.');
  });

  it('says when nothing more is due today', () => {
    expect(text({}, { decks: [], totals: { dueReviews: 0, newCards: 0 } })).toContain(
      'Today: 12 reviews done; nothing more is due today.',
    );
  });

  it('says when retention cannot be measured yet', () => {
    expect(text({ retention30d: null })).toContain(
      'Retention (last 30 days): not measured yet; no learned card was reviewed in the last 30 days.',
    );
  });

  it('lists the weak cards with the ids to act on them, and how to help', () => {
    const lines = text({
      weakCards: [
        testWeakCard({
          cardId: CARD_ID,
          direction: 'reverse',
          prompt: 'to speak',
          answer: 'hablar',
          extra: '-ar verb',
        }),
      ],
    }).split('\n');

    expect(lines.slice(-3)).toEqual([
      'Weak cards (forgotten at least 2 times in the last 30 days), most forgotten first:',
      `1. in "Spanish verbs" (deck id: ${STUDY_DECK_ID}, card id: ${CARD_ID}, direction: reverse) ask: to speak | answer: hablar | extra: -ar verb | forgotten 3 times, last 2026-11-16T10:00:00.000Z`,
      'To help: explain what makes each one hard to remember, quiz the user on them when they are due, or, once the user agrees, make a card clearer with update_card (one fact per card, a short answer).',
    ]);
  });
});
