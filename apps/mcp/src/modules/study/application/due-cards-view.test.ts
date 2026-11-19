import type { DueCards } from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import { STUDY_DECK_ID, testDueCard, testStudyDeck } from '../testing/fake-study-api.js';
import { formatDueCards, toDueCards } from './due-cards-view.js';

const WEB_URL = 'https://deck.club';
const AS_OF = '2026-11-17T10:00:00.000Z';
const FIRST = '00000000-0000-4000-8000-000000000001';
const SECOND = '00000000-0000-4000-8000-000000000002';
const due = (cards: DueCards['cards'], totalDue = cards.length): DueCards => ({ cards, totalDue });

describe('toDueCards', () => {
  it('keeps each card as the API oriented it, with when each rating brings it back', () => {
    const output = toDueCards(due([testDueCard({ cardId: FIRST })]), null, WEB_URL, AS_OF);

    expect(output).toEqual({
      deck: null,
      cards: [
        {
          deckId: STUDY_DECK_ID,
          deckTitle: 'Spanish verbs',
          cardId: FIRST,
          direction: 'forward',
          cardType: 'basic',
          state: 'new',
          prompt: 'hablar',
          answer: 'to speak',
          extra: '',
          nextDue: {
            again: '2026-11-17T10:01:00.000Z',
            hard: '2026-11-17T10:06:00.000Z',
            good: '2026-11-17T10:10:00.000Z',
            easy: '2026-11-20T10:00:00.000Z',
          },
        },
      ],
      totalDue: 1,
      libraryUrl: 'https://deck.club/decks',
      asOf: AS_OF,
    });
  });

  it('names the deck a session is limited to, with its link and card count', () => {
    const output = toDueCards(due([]), testStudyDeck({ cardCount: 7 }), WEB_URL, AS_OF);

    expect(output.deck).toEqual({
      id: STUDY_DECK_ID,
      title: 'Spanish verbs',
      url: `https://deck.club/decks/${STUDY_DECK_ID}`,
      cardCount: 7,
    });
  });
});

describe('formatDueCards', () => {
  it('lists each card with its state, its deck, the ids to review it and both sides', () => {
    const text = formatDueCards(
      toDueCards(
        due([
          testDueCard({ cardId: FIRST, extra: 'Regular -ar verb' }),
          testDueCard({
            cardId: SECOND,
            direction: 'reverse',
            cardType: 'reversible',
            state: 'relearning',
            prompt: 'to eat',
            answer: 'comer',
          }),
        ]),
        null,
        WEB_URL,
        AS_OF,
      ),
    );

    expect(text.split('\n').slice(0, 3)).toEqual([
      '2 cards are due now across all decks; in session order:',
      `1. [new] in "Spanish verbs" (deck id: ${STUDY_DECK_ID}, card id: ${FIRST}, direction: forward) ask: hablar | answer: to speak | extra: Regular -ar verb`,
      `2. [relearning] in "Spanish verbs" (deck id: ${STUDY_DECK_ID}, card id: ${SECOND}, direction: reverse) ask: to eat | answer: comer`,
    ]);
  });

  it('tells the AI how to run the quiz: one card at a time, answer hidden, every rating recorded', () => {
    const text = formatDueCards(
      toDueCards(due([testDueCard({ cardId: FIRST })]), null, WEB_URL, AS_OF),
    );

    expect(text).toContain('one card at a time');
    expect(text).toContain('never show the answer before they reply');
    expect(text).toContain(
      'submit_review, passing the card’s deck id, card id and direction, a rating (again = forgot, hard, good or easy) and a new idempotencyKey.',
    );
  });

  it('says how many more are due after the cards shown, and how to get them', () => {
    const text = formatDueCards(
      toDueCards(due([testDueCard({ cardId: FIRST })], 31), testStudyDeck(), WEB_URL, AS_OF),
    );

    expect(text.split('\n')[0]).toBe(
      '31 cards are due now in "Spanish verbs"; here are the first 1, in session order:',
    );
    expect(text).toContain(
      '30 more are due after these: when these are recorded, call get_due_cards again for the next ones.',
    );
  });

  it('says "1 card is due" for a single card, and nothing about more', () => {
    const text = formatDueCards(
      toDueCards(due([testDueCard({ cardId: FIRST })]), null, WEB_URL, AS_OF),
    );

    expect(text).toMatch(/^1 card is due now across all decks;/);
    expect(text).not.toContain('more are due');
  });

  it('tells the AI the user is done for now when nothing is due in any deck', () => {
    expect(formatDueCards(toDueCards(due([]), null, WEB_URL, AS_OF))).toBe(
      'Nothing is due right now in any deck: every card is scheduled for later, or today’s new-card limit is reached. Tell the user they are done for now; offer to add new cards with add_cards.',
    );
  });

  it('names the deck when nothing is due in it, and how to look at every deck', () => {
    const text = formatDueCards(toDueCards(due([]), testStudyDeck(), WEB_URL, AS_OF));

    expect(text).toBe(
      `Nothing is due right now in "Spanish verbs" (id: ${STUDY_DECK_ID}): every card is scheduled for later, or today’s new-card limit is reached. Tell the user they are done with this deck for now; get_due_cards without a deck id looks at every deck.`,
    );
  });

  it('offers to add cards to a deck that has none, with its link', () => {
    const text = formatDueCards(
      toDueCards(due([]), testStudyDeck({ cardCount: 0 }), WEB_URL, AS_OF),
    );

    expect(text).toBe(
      `The deck "Spanish verbs" (id: ${STUDY_DECK_ID}) has no cards yet, so there is nothing to study. Offer to add some with add_cards. https://deck.club/decks/${STUDY_DECK_ID}`,
    );
  });
});
