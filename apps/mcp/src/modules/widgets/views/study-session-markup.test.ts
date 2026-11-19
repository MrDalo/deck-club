import type { DueCard, SubmitReviewOutput } from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import { deckAccent } from './deck-accent.js';
import { renderStudySession } from './study-session-markup.js';
import type { StudySession } from './study-session-state.js';

const SPANISH = '00000000-0000-4000-8000-0000000000d1';
const FRENCH = '00000000-0000-4000-8000-0000000000d2';
const AS_OF = '2026-11-17T10:00:00.000Z';
const card = (index: number, overrides: Partial<DueCard> = {}): DueCard => ({
  deckId: SPANISH,
  deckTitle: 'Spanish',
  cardId: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
  direction: 'forward',
  cardType: 'basic',
  state: 'new',
  prompt: `hablar ${index}`,
  answer: `to speak ${index}`,
  extra: '',
  nextDue: {
    again: '2026-11-17T10:01:00.000Z',
    hard: '2026-11-17T10:06:00.000Z',
    good: '2026-11-17T10:10:00.000Z',
    easy: '2026-11-20T10:00:00.000Z',
  },
  ...overrides,
});
const SPANISH_DECK = {
  id: SPANISH,
  title: 'Spanish',
  url: `https://deck.club/decks/${SPANISH}`,
  cardCount: 40,
};
const session = (overrides: Partial<StudySession> = {}): StudySession => ({
  deck: null,
  cards: [card(1), card(2, { deckId: FRENCH, deckTitle: 'French', state: 'review' })],
  totalDue: 2,
  libraryUrl: 'https://deck.club/decks',
  asOf: AS_OF,
  ...overrides,
});
const reviewOf = (
  index: number,
  overrides: Partial<SubmitReviewOutput> = {},
): SubmitReviewOutput => {
  const rated = card(index);
  return {
    reviewId: '00000000-0000-4000-8000-000000000099',
    deckId: rated.deckId,
    cardId: rated.cardId,
    direction: rated.direction,
    rating: 'good',
    state: 'review',
    nextDueAt: '2026-11-20T10:00:00.000Z',
    replayed: false,
    asOf: AS_OF,
    ...overrides,
  };
};

describe('renderStudySession', () => {
  it('counts the cards due and says where they come from', () => {
    const html = renderStudySession(session());

    expect(html).toContain('2 cards to review');
    expect(html).toContain('Across your decks · in review order');
  });

  it('says when it shows only the next cards, and how many wait after them', () => {
    const html = renderStudySession(session({ cards: [card(1)], totalDue: 12 }));

    expect(html).toContain('12 cards to review');
    expect(html).toContain('the next 1, in review order');
    expect(html).toContain('11 more cards due after these.');
  });

  it('shows each question on a ruled index card, numbered in session order', () => {
    const html = renderStudySession(session());

    expect(html).toContain('<ol class="card-list">');
    expect(html.match(/<li class="card">/g)).toHaveLength(2);
    expect(html).toContain('<p class="card-front" dir="auto">hablar 1</p>');
  });

  it('keeps every answer face down until the user opens it', () => {
    const html = renderStudySession(session({ cards: [card(1, { extra: 'Regular -ar verb' })] }));

    expect(html.match(/<details class="reveal"/g)).toHaveLength(1);
    expect(html).not.toMatch(/<details[^>]* open/);
    expect(html).toMatch(
      /<details class="reveal" id="answer-\d+-0">\s*<summary[^>]*>.*Show answer.*<\/summary>[\s\S]*to speak 1[\s\S]*Regular -ar verb[\s\S]*<\/details>/,
    );
  });

  it('names each answer toggle for screen readers by its card', () => {
    const html = renderStudySession(session());

    expect(html).toContain('<span class="visually-hidden"> to card 2</span>');
  });

  it('names each card’s deck in its own pastel when the session spans decks', () => {
    const html = renderStudySession(session());

    expect(html).toContain(
      `<span class="chip chip-deck" style="--deck-accent: ${deckAccent(FRENCH)}" aria-label="Deck: French">French</span>`,
    );
  });

  it('colours the heading with the deck and leaves the deck chips out for one deck', () => {
    const html = renderStudySession(session({ deck: SPANISH_DECK, cards: [card(1)], totalDue: 1 }));

    expect(html).toContain(`style="--highlight: ${deckAccent(SPANISH)}"`);
    expect(html).toContain('In Spanish · in review order');
    expect(html).not.toContain('chip-deck');
  });

  it('marks whether a card is new or a review, and a card asked from its back', () => {
    const html = renderStudySession(
      session({
        cards: [card(1), card(2, { state: 'relearning', direction: 'reverse' })],
      }),
    );

    expect(html).toContain('<span class="chip chip-sky" aria-label="State: New">New</span>');
    expect(html).toContain(
      '<span class="chip chip-paper" aria-label="State: Relearning">Relearning</span>',
    );
    expect(html).toContain('aria-label="Asked from the back of the card">Back to front</span>');
  });

  it('offers the quiz in the chat for every deck, and the library', () => {
    const html = renderStudySession(session());

    expect(html).toContain('data-action="ask" data-value="Quiz me on my due cards."');
    expect(html).toContain('data-action="open" data-value="https://deck.club/decks"');
  });

  it('offers the quiz on the deck itself, and its page, for one deck', () => {
    const html = renderStudySession(session({ deck: SPANISH_DECK, cards: [card(1)], totalDue: 1 }));

    expect(html).toContain(
      'data-action="ask" data-value="Quiz me on my &quot;Spanish&quot; deck."',
    );
    expect(html).toContain(`data-action="open" data-value="https://deck.club/decks/${SPANISH}"`);
  });

  it('puts the four ratings under each answer, each saying when the card comes back', () => {
    const html = renderStudySession(session({ cards: [card(1)], totalDue: 1 }));
    const answer = html.slice(html.indexOf('<details'), html.indexOf('</details>'));

    expect(answer).toContain('How well did you know it?');
    expect(answer.match(/data-action="rate"/g)).toHaveLength(4);
    expect(answer).toContain(
      'data-action="rate" data-value="0:again">Again <span class="rating-hint"><span class="visually-hidden">back in </span>1 min</span>',
    );
    expect(answer).toContain('data-value="0:hard">Hard');
    expect(answer).toContain('data-value="0:good">Good <span class="rating-hint">');
    expect(answer).toContain('back in </span>3 days</span>');
  });

  it('labels each card’s ratings as a group, named by its question', () => {
    const html = renderStudySession(session());

    expect(html).toMatch(
      /<div class="rating" role="group" aria-labelledby="(rate-\d+-1)">\s*<p class="rating-title" id="\1">/,
    );
  });

  it('shows a rated card open with what was recorded, instead of the ratings', () => {
    const html = renderStudySession(session({ reviewed: { 0: reviewOf(1) } }));
    const first = html.slice(0, html.indexOf('</li>'));

    expect(first).toMatch(/<details class="reveal" id="answer-\d+-0" open>/);
    expect(first).toContain(
      '<span class="chip chip-mint" aria-label="Rated Good">Good</span> Recorded · back in 3 days',
    );
    expect(first).not.toContain('data-action="rate"');
  });

  it('says when a rating was already recorded by an earlier press', () => {
    const html = renderStudySession(
      session({ reviewed: { 0: reviewOf(1, { replayed: true, rating: 'again' }) } }),
    );

    expect(html).toContain('chip-rose" aria-label="Rated Again">Again</span> Already recorded');
  });

  it('counts the ratings so far, and moves the focus to the next card left to rate', () => {
    const html = renderStudySession(session({ reviewed: { 0: reviewOf(1) } }));

    expect(html).toContain('1 of 2 rated.');
    expect(html.match(/data-focus/g)).toHaveLength(1);
    expect(html).toMatch(/<summary class="reveal-toggle" data-focus>.*to card 2</);
  });

  it('ends the session when every card is rated, offering the next cards', () => {
    const html = renderStudySession(
      session({
        cards: [card(1)],
        totalDue: 5,
        reviewed: { 0: reviewOf(1) },
      }),
    );

    expect(html).toContain('Session done');
    expect(html).toContain('You rated 1 card. 4 more cards were due after these.');
    expect(html).toMatch(/data-action="next" data-value="\d+" data-focus>Next cards<\/button>/);
    expect(html).not.toContain('Rate here, or get quizzed');
    expect(html).not.toContain('rated.');
  });

  it('says the user is all caught up when nothing is due, and lists no cards', () => {
    const html = renderStudySession(session({ cards: [], totalDue: 0 }));

    expect(html).toContain('Nothing to review');
    expect(html).toContain('All caught up');
    expect(html).toContain('data-action="open" data-value="https://deck.club/decks"');
    expect(html).not.toContain('<ol');
  });

  it('points at the other decks when one deck is done for now', () => {
    const html = renderStudySession(session({ deck: SPANISH_DECK, cards: [], totalDue: 0 }));

    expect(html).toContain('All caught up');
    expect(html).toContain('data-value="Quiz me on my due cards."');
  });

  it('offers to write cards for a deck that has none', () => {
    const html = renderStudySession(
      session({ deck: { ...SPANISH_DECK, cardCount: 0 }, cards: [], totalDue: 0 }),
    );

    expect(html).toContain('No cards yet');
    expect(html).toContain('data-value="Add 10 new cards to my &quot;Spanish&quot; deck."');
    expect(html).not.toContain('All caught up');
  });

  it('escapes the deck and both sides of a card, so none can inject markup', () => {
    const html = renderStudySession(
      session({
        cards: [
          card(1, {
            deckTitle: '<b>Deck</b>',
            prompt: '<script>alert(1)</script>',
            answer: '<img src=x onerror=alert(1)>',
            extra: '"><svg onload=alert(1)>',
          }),
        ],
      }),
    );

    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<svg');
    expect(html).not.toContain('<b>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });
});
