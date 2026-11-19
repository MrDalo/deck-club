import { Logger } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DeckClubError } from '../../../common/errors/deck-club-error.js';
import { testCaller } from '../../../common/mcp/testing/mcp-test-client.js';
import {
  FakeStudyApi,
  STUDY_DECK_ID,
  testDueCard,
  testStudyDeck,
  testWeakCard,
} from '../testing/fake-study-api.js';
import { createStudyService } from '../testing/study-test-kit.js';

const DECK_ID = '00000000-0000-4000-8000-000000000001';
const FRENCH_ID = '00000000-0000-4000-8000-0000000000e2';
const caller = testCaller();
const cardId = (index: number): string =>
  `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`;

/** Ana has two decks; 12 Spanish cards and 1 French card are due, in session order. */
function anaStudying(): FakeStudyApi {
  const spanish = Array.from({ length: 12 }, (_, index) =>
    testDueCard({ cardId: cardId(index + 1), prompt: `front ${index + 1}` }),
  );
  const french = testDueCard({
    cardId: cardId(100),
    deckId: FRENCH_ID,
    deckTitle: 'French',
    state: 'review',
    prompt: 'parler',
  });
  return new FakeStudyApi()
    .withDecks(caller.accessToken, [
      testStudyDeck(),
      testStudyDeck({ id: FRENCH_ID, title: 'French' }),
    ])
    .withDueCards(caller.accessToken, [...spanish, french]);
}

/** Freezes the clock (only Date, so promises still run) at an ISO time. */
function atNow(iso: string): void {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(iso));
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('StudyService.getDueCards', () => {
  it('answers with the first due cards of every deck, as text for the AI and data for its view', async () => {
    const { study, api } = createStudyService(anaStudying());

    const reply = await study.getDueCards(caller, { limit: 10 });

    expect(reply.text.split('\n')[0]).toBe(
      '13 cards are due now across all decks; here are the first 10, in session order:',
    );
    expect(reply.structuredContent).toMatchObject({
      deck: null,
      totalDue: 13,
      libraryUrl: 'https://deck.club/decks',
    });
    expect((reply.structuredContent as { cards: unknown[] }).cards).toHaveLength(10);
    expect(api.dueRequests).toEqual([{ deckId: undefined, limit: 10 }]);
  });

  it('stamps the session with the time its rating hints count from', async () => {
    atNow('2026-11-17T10:00:00.000Z');
    const { study } = createStudyService(anaStudying());

    const reply = await study.getDueCards(caller, { limit: 1 });

    expect(reply.structuredContent).toMatchObject({ asOf: '2026-11-17T10:00:00.000Z' });
  });

  it('limits the session to one deck and names it, with its link and card count', async () => {
    const { study, api } = createStudyService(anaStudying());

    const reply = await study.getDueCards(caller, { deckId: FRENCH_ID, limit: 10 });

    expect(reply.text).toContain('1 card is due now in "French"; in session order:');
    expect(reply.structuredContent).toMatchObject({
      deck: {
        id: FRENCH_ID,
        title: 'French',
        url: `https://deck.club/decks/${FRENCH_ID}`,
        cardCount: 30,
      },
      cards: [{ cardId: cardId(100), prompt: 'parler', state: 'review' }],
      totalDue: 1,
    });
    expect(api.dueRequests).toEqual([{ deckId: FRENCH_ID, limit: 10 }]);
  });

  it('gives the AI the ids and direction submit_review needs, and the quiz rules', async () => {
    const { study } = createStudyService(anaStudying());

    const reply = await study.getDueCards(caller, { deckId: FRENCH_ID, limit: 1 });

    expect(reply.text).toContain(
      `1. [review] in "French" (deck id: ${FRENCH_ID}, card id: ${cardId(100)}, direction: forward) ask: parler | answer: to speak`,
    );
    expect(reply.text).toContain('never show the answer before they reply');
    expect(reply.text).toContain('submit_review');
  });

  it('asks the API as the caller, so it only ever reads that user’s schedule', async () => {
    const api = anaStudying().withDueCards('token-ben', []);
    const { study } = createStudyService(api);

    const reply = await study.getDueCards(
      testCaller({ accessToken: 'token-ben', userId: 'user-ben' }),
      { limit: 10 },
    );

    expect(reply.structuredContent).toMatchObject({ cards: [], totalDue: 0 });
    expect(api.callers.map((each) => each.accessToken)).toEqual(['token-ben']);
  });

  it('tells the AI when nothing is due, rather than returning an empty list silently', async () => {
    const { study } = createStudyService(
      new FakeStudyApi().withDecks(caller.accessToken, [testStudyDeck()]),
    );

    const reply = await study.getDueCards(caller, { deckId: STUDY_DECK_ID, limit: 10 });

    expect(reply.text).toMatch(/^Nothing is due right now in "Spanish verbs"/);
    expect(reply.structuredContent).toMatchObject({ cards: [], totalDue: 0 });
  });

  it('tells an empty deck from a finished one, and offers to add cards', async () => {
    const { study } = createStudyService(
      new FakeStudyApi().withDecks(caller.accessToken, [testStudyDeck({ cardCount: 0 })]),
    );

    const reply = await study.getDueCards(caller, { deckId: STUDY_DECK_ID, limit: 10 });

    expect(reply.text).toContain('has no cards yet');
    expect(reply.text).toContain('add_cards');
  });

  it('relays DECK_NOT_FOUND for a deck that is not the caller’s', async () => {
    const { study } = createStudyService(anaStudying());

    await expect(
      study.getDueCards(testCaller({ accessToken: 'token-ben' }), {
        deckId: STUDY_DECK_ID,
        limit: 10,
      }),
    ).rejects.toMatchObject({ code: 'DECK_NOT_FOUND' });
  });

  it('relays the API’s refusal when it rejects the caller’s token', async () => {
    const api = new FakeStudyApi().failWith(
      new DeckClubError('UNAUTHENTICATED', 'Your session has expired. Sign in again.'),
    );

    await expect(
      createStudyService(api).study.getDueCards(caller, { limit: 10 }),
    ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  });

  it('relays the API being unreachable instead of saying nothing is due', async () => {
    const api = new FakeStudyApi().failWith(
      new DeckClubError('UPSTREAM_UNAVAILABLE', 'Deck Club is not reachable right now.'),
    );

    await expect(
      createStudyService(api).study.getDueCards(caller, { deckId: DECK_ID, limit: 10 }),
    ).rejects.toMatchObject({ code: 'UPSTREAM_UNAVAILABLE' });
  });

  it('records the read by counts, never a prompt, an answer or a deck title', async () => {
    const log = vi.spyOn(Logger.prototype, 'log').mockReturnValue(undefined);
    const { study } = createStudyService(anaStudying());

    await study.getDueCards(caller, { deckId: STUDY_DECK_ID, limit: 5 });

    expect(log).toHaveBeenCalledWith({
      evt: 'study.due_read',
      user: 'user-ana',
      scope: 'deck',
      deck: STUDY_DECK_ID,
      shown: 5,
      totalDue: 12,
    });
    const logged = JSON.stringify(log.mock.calls);
    for (const content of ['front 1', 'to speak', 'Spanish']) expect(logged).not.toContain(content);
  });
});

describe('StudyService.submitReview', () => {
  const NOW = '2026-11-17T10:00:00.000Z';
  const FIRST = cardId(1);
  const rate = (overrides: Record<string, unknown> = {}) => ({
    deckId: STUDY_DECK_ID,
    cardId: FIRST,
    direction: 'forward' as const,
    rating: 'good' as const,
    ...overrides,
  });

  it('records the rating through the API as the caller, for the AI and for the view', async () => {
    atNow(NOW);
    const { study, api } = createStudyService(anaStudying());

    const reply = await study.submitReview(caller, rate());

    expect(reply.text.split('\n')).toEqual([
      `Recorded "good" for card ${FIRST} (forward) in deck ${STUDY_DECK_ID}. It is now in review and comes back in 3 days (2026-11-20T10:00:00.000Z).`,
      'Go on with the next card.',
    ]);
    expect(reply.structuredContent).toEqual({
      reviewId: expect.any(String) as string,
      deckId: STUDY_DECK_ID,
      cardId: FIRST,
      direction: 'forward',
      rating: 'good',
      state: 'review',
      nextDueAt: '2026-11-20T10:00:00.000Z',
      replayed: false,
      asOf: NOW,
    });
    expect(api.reviews).toEqual([rate()]);
    expect(api.callers.map((each) => each.clientName)).toEqual(['Claude']);
  });

  it('sends the AI’s idempotencyKey with the review, never in it', async () => {
    const { study, api } = createStudyService(anaStudying());

    await study.submitReview(caller, rate({ idempotencyKey: 'review-key-1' }));

    expect(api.idempotencyKeys).toEqual(['review-key-1']);
    expect(api.reviews[0]).not.toHaveProperty('idempotencyKey');
  });

  it('sends no key when the AI gives none', async () => {
    const { study, api } = createStudyService(anaStudying());

    await study.submitReview(caller, rate());

    expect(api.idempotencyKeys).toEqual([undefined]);
  });

  it('answers a retry with the first review and says nothing was rated twice', async () => {
    const { study } = createStudyService(anaStudying());
    const first = await study.submitReview(caller, rate({ idempotencyKey: 'review-key-1' }));

    const retry = await study.submitReview(caller, rate({ idempotencyKey: 'review-key-1' }));

    expect(retry.text).toMatch(/^Already done: an earlier submit_review call/);
    expect(retry.structuredContent).toMatchObject({
      reviewId: (first.structuredContent as { reviewId: string }).reviewId,
      replayed: true,
    });
  });

  it('says when a card stays in today’s session after "again"', async () => {
    const { study } = createStudyService(anaStudying());

    const reply = await study.submitReview(caller, rate({ rating: 'again' }));

    expect(reply.text).toContain('It is now in learning and comes back in 1 min');
    expect(reply.structuredContent).toMatchObject({ rating: 'again', state: 'learning' });
  });

  it('relays DECK_NOT_FOUND for a deck that is not the caller’s', async () => {
    const { study } = createStudyService(anaStudying());

    await expect(
      study.submitReview(testCaller({ accessToken: 'token-ben' }), rate()),
    ).rejects.toMatchObject({ code: 'DECK_NOT_FOUND' });
  });

  it('relays CARD_NOT_FOUND for a card that is not in the deck', async () => {
    const { study } = createStudyService(anaStudying());

    await expect(study.submitReview(caller, rate({ cardId: cardId(999) }))).rejects.toMatchObject({
      code: 'CARD_NOT_FOUND',
    });
  });

  it('relays DIRECTION_NOT_STUDIED for the reverse side of a basic card', async () => {
    const { study } = createStudyService(anaStudying());

    await expect(study.submitReview(caller, rate({ direction: 'reverse' }))).rejects.toMatchObject({
      code: 'DIRECTION_NOT_STUDIED',
      detail: 'Only reversible cards are studied in the reverse direction.',
    });
  });

  it('tells the AI a retry with the same key is safe when the rating was not confirmed', async () => {
    const api = anaStudying().failReviewsWith(
      new DeckClubError('UPSTREAM_UNAVAILABLE', 'Deck Club is not reachable right now.'),
    );

    await expect(
      createStudyService(api).study.submitReview(caller, rate({ idempotencyKey: 'review-key-1' })),
    ).rejects.toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
      detail:
        'Deck Club did not confirm that the rating was recorded. Call submit_review again with exactly the same arguments and the same idempotencyKey: it is never done twice.',
    });
  });

  it('tells the AI to check the queue first when an unconfirmed rating had no key', async () => {
    const api = anaStudying().failReviewsWith(
      new DeckClubError('UPSTREAM_UNAVAILABLE', 'Deck Club is not reachable right now.'),
    );

    await expect(createStudyService(api).study.submitReview(caller, rate())).rejects.toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
      detail: expect.stringContaining(
        'call get_due_cards and rate the card again only if it is still due',
      ) as string,
    });
  });

  it('explains a key reused for another rating in the words of the tool', async () => {
    const { study } = createStudyService(anaStudying());
    await study.submitReview(caller, rate({ idempotencyKey: 'review-key-1' }));

    await expect(
      study.submitReview(caller, rate({ rating: 'easy', idempotencyKey: 'review-key-1' })),
    ).rejects.toMatchObject({
      code: 'IDEMPOTENCY_KEY_REUSED',
      detail: expect.stringContaining('Use a new key for a new submit_review call') as string,
    });
  });

  it('records the review by ids and rating, never the card’s content or the key', async () => {
    const log = vi.spyOn(Logger.prototype, 'log').mockReturnValue(undefined);
    const { study } = createStudyService(anaStudying());

    await study.submitReview(caller, rate({ idempotencyKey: 'review-key-1' }));

    expect(log).toHaveBeenCalledWith({
      evt: 'study.reviewed',
      user: 'user-ana',
      deck: STUDY_DECK_ID,
      card: FIRST,
      direction: 'forward',
      rating: 'good',
      state: 'review',
      client: 'Claude',
      replayed: false,
    });
    const logged = JSON.stringify(log.mock.calls);
    for (const secret of ['front 1', 'to speak', 'review-key-1'])
      expect(logged).not.toContain(secret);
  });
});

describe('StudyService.getStats', () => {
  const weak = testWeakCard({ cardId: cardId(1) });
  const progressing = (): FakeStudyApi =>
    new FakeStudyApi()
      .withStats(caller.accessToken, {
        streakDays: 4,
        reviewedToday: 12,
        totalReviews: 230,
        retention30d: 0.9,
        weakCards: [weak],
      })
      .withToday(caller.accessToken, {
        decks: [{ deckId: STUDY_DECK_ID, title: 'Spanish verbs', dueReviews: 5, newCards: 3 }],
        totals: { dueReviews: 5, newCards: 3 },
      });

  it('answers with the stats and today’s workload, as text for the AI and data for its view', async () => {
    const { study } = createStudyService(progressing());

    const reply = await study.getStats(caller, {});

    expect(reply.text.split('\n')[0]).toBe('Streak: 4 days in a row, including today.');
    expect(reply.text).toContain('Retention (last 30 days): 90%');
    expect(reply.structuredContent).toEqual({
      streakDays: 4,
      reviewedToday: 12,
      totalReviews: 230,
      retention30d: 0.9,
      weakCards: [weak],
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

  it('reads both as the caller, so a new user sees only their own empty start', async () => {
    const api = progressing();
    const { study } = createStudyService(api);

    const reply = await study.getStats(testCaller({ accessToken: 'token-ben' }), {});

    expect(reply.structuredContent).toMatchObject({
      streakDays: 0,
      totalReviews: 0,
      weakCards: [],
      decksDueToday: [],
    });
    expect(api.callers.map((each) => each.accessToken)).toEqual(['token-ben', 'token-ben']);
  });

  it('relays the API’s refusal when it rejects the caller’s token', async () => {
    const api = new FakeStudyApi().failWith(
      new DeckClubError('UNAUTHENTICATED', 'Your session has expired. Sign in again.'),
    );

    await expect(createStudyService(api).study.getStats(caller, {})).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    });
  });

  it('relays the API being unreachable instead of reporting zeros', async () => {
    const api = new FakeStudyApi().failWith(
      new DeckClubError('UPSTREAM_UNAVAILABLE', 'Deck Club is not reachable right now.'),
    );

    await expect(createStudyService(api).study.getStats(caller, {})).rejects.toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
    });
  });

  it('records the read by numbers, never a weak card’s content or a deck title', async () => {
    const log = vi.spyOn(Logger.prototype, 'log').mockReturnValue(undefined);
    const { study } = createStudyService(progressing());

    await study.getStats(caller, {});

    expect(log).toHaveBeenCalledWith({
      evt: 'study.stats_read',
      user: 'user-ana',
      streakDays: 4,
      reviewedToday: 12,
      stillDue: 8,
      weakCards: 1,
    });
    const logged = JSON.stringify(log.mock.calls);
    for (const content of ['hablar', 'to speak', 'Spanish']) expect(logged).not.toContain(content);
  });
});

describe('StudyService (interface only, not built yet)', () => {
  const { study } = createStudyService();

  it.each([
    ['today resource', () => study.readToday(caller)],
    ['Quiz me', () => study.quizMePrompt({})],
    ['Find my weak spots', () => study.findWeakSpotsPrompt({})],
  ])('%s refuses with NOT_IMPLEMENTED', async (capability, call) => {
    await expect(call()).rejects.toMatchObject({
      code: 'NOT_IMPLEMENTED',
      detail: expect.stringContaining(capability) as string,
    });
  });
});
