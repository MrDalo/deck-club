import type { GetStatsOutput, WeakCard } from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import { deckAccent } from './deck-accent.js';
import { readStats, renderStats } from './stats-markup.js';

const SPANISH = '00000000-0000-4000-8000-0000000000d1';
const weak = (overrides: Partial<WeakCard> = {}): WeakCard => ({
  deckId: SPANISH,
  deckTitle: 'Spanish',
  cardId: '00000000-0000-4000-8000-000000000001',
  direction: 'forward',
  cardType: 'basic',
  prompt: 'hablar',
  answer: 'to speak',
  extra: '',
  forgotten: 3,
  lastForgottenAt: '2026-11-16T10:00:00.000Z',
  ...overrides,
});
const stats = (overrides: Partial<GetStatsOutput> = {}): GetStatsOutput => ({
  streakDays: 4,
  reviewedToday: 12,
  totalReviews: 230,
  retention30d: 0.871,
  weakCards: [weak()],
  dueToday: { dueReviews: 5, newCards: 3 },
  decksDueToday: [
    {
      id: SPANISH,
      title: 'Spanish',
      url: `https://deck.club/decks/${SPANISH}`,
      dueReviews: 5,
      newCards: 3,
    },
  ],
  libraryUrl: 'https://deck.club/decks',
  ...overrides,
});

describe('renderStats', () => {
  it('shows the streak, today, retention and the total as four tiles', () => {
    const html = renderStats(stats());

    expect(html.match(/<li class="stat stat-/g)).toHaveLength(4);
    expect(html).toContain('<p class="stat-value">4 <span class="stat-unit">days</span></p>');
    expect(html).toContain('<p class="stat-value">12 <span class="stat-unit">done</span></p>');
    expect(html).toContain('<p class="stat-value">87%</p>');
    expect(html).toContain('<p class="stat-value">230 <span class="stat-unit">reviews</span></p>');
    expect(html).toContain('8 cards left');
  });

  it('draws today’s progress as a bar a screen reader can read', () => {
    expect(renderStats(stats())).toContain(
      '<div class="progress" role="progressbar" aria-label="Today’s progress" aria-valuemin="0" aria-valuemax="20" aria-valuenow="12" aria-valuetext="12 of 20 done"><span class="progress-fill" style="width: 60%"></span></div>',
    );
  });

  it('encourages: a streak that counts today, one still to keep, one to start', () => {
    expect(renderStats(stats())).toContain('A 4-day streak, and today counts.');
    expect(renderStats(stats({ reviewedToday: 0 }))).toContain(
      'Study today to keep your 4-day streak.',
    );
    expect(renderStats(stats({ streakDays: 0, reviewedToday: 0 }))).toContain(
      'Review a card today to start a streak.',
    );
  });

  it('lists what is still due per deck, each with its own quiz', () => {
    const html = renderStats(stats());

    expect(html).toContain(
      `<span class="chip chip-deck" style="--deck-accent: ${deckAccent(SPANISH)}" aria-label="Deck: Spanish">Spanish</span>`,
    );
    expect(html).toContain('5 reviews · 3 new');
    expect(html).toContain(
      'data-action="ask" data-value="Quiz me on my &quot;Spanish&quot; deck." aria-label="Quiz me on Spanish"',
    );
    expect(html).toContain('data-value="Quiz me on my due cards."');
  });

  it('says when nothing is left today, and offers no quiz', () => {
    const html = renderStats(
      stats({ dueToday: { dueReviews: 0, newCards: 0 }, decksDueToday: [] }),
    );

    expect(html).toContain('Nothing left for today.');
    expect(html).toContain('Nothing left today');
    expect(html).not.toContain('Quiz me');
    expect(html).toContain('style="width: 100%"');
  });

  it('shows each weak card with both sides, how often it was forgotten, and a way to get help', () => {
    const html = renderStats(stats({ weakCards: [weak({ direction: 'reverse', extra: '-ar' })] }));
    const section = html.slice(html.indexOf('Cards you keep forgetting'));

    expect(section).toContain('Forgotten at least 2 times in the last 30 days.');
    expect(section).toContain('<p class="card-front" dir="auto">hablar</p>');
    expect(section).toContain('<p class="card-back" dir="auto">to speak</p>');
    expect(section).toContain(
      '<span class="chip chip-rose" aria-label="Forgotten 3 times">Forgotten 3×</span>',
    );
    expect(section).toContain('Back to front');
    expect(section).toContain(
      'data-value="Help me remember my card &quot;hablar&quot;: I keep forgetting it." aria-label="Help me remember hablar"',
    );
  });

  it('says there are no weak cards, and lists none', () => {
    const html = renderStats(stats({ weakCards: [] }));

    expect(html).toContain('None right now: no card was forgotten 2 times in the last 30 days.');
    expect(html).not.toContain('<ol');
  });

  it('shows a dash for retention until it can be measured', () => {
    const html = renderStats(stats({ retention30d: null }));

    expect(html).toContain('<p class="stat-value">–</p>');
    expect(html).toContain('Not measured yet');
  });

  it('offers to refresh through the host, and takes the focus back after it', () => {
    expect(renderStats(stats())).toMatch(
      /data-action="refresh" data-value="get_stats" data-focus>Refresh<\/button>/,
    );
  });

  it('escapes deck titles and cards, so none can inject markup', () => {
    const html = renderStats(
      stats({
        weakCards: [weak({ deckTitle: '<b>Deck</b>', prompt: '<img src=x>', answer: '<script>' })],
        decksDueToday: [
          {
            id: SPANISH,
            title: '"><svg>',
            url: 'https://deck.club/decks/x',
            dueReviews: 1,
            newCards: 0,
          },
        ],
      }),
    );

    for (const raw of ['<b>', '<img', '<script>', '<svg>']) expect(html).not.toContain(raw);
    expect(html).toContain('&lt;img src=x&gt;');
  });
});

describe('readStats', () => {
  it('reads stats the view fetched itself, and gives up on anything else', () => {
    expect(readStats({ structuredContent: stats() })).toEqual(stats());
    expect(readStats({ isError: true, structuredContent: stats() })).toBeNull();
    expect(readStats({ structuredContent: { streakDays: 1 } })).toBeNull();
  });
});
