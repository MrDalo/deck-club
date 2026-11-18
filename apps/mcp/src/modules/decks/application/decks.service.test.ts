import { Logger } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { DeckClubError } from '../../../common/errors/deck-club-error.js';
import { testCaller } from '../../../common/mcp/testing/mcp-test-client.js';
import { createDecksService } from '../testing/decks-test-kit.js';
import { FakeDecksApi, testCard, testDeck } from '../testing/fake-decks-api.js';
import { testHit, testSearchResult } from '../testing/search-hits.js';

const DECK_ID = '00000000-0000-4000-8000-000000000001';
const CARD_ID = '00000000-0000-4000-8000-000000000002';
const caller = testCaller();
const SPANISH = testDeck({ id: DECK_ID, title: 'Spanish verbs', language: 'es', cardCount: 42 });

describe('DecksService.listDecks', () => {
  it('answers with the library as text for the AI and as data for its view', async () => {
    const { decks } = createDecksService(
      new FakeDecksApi().withDecks(caller.accessToken, [SPANISH]),
    );

    const reply = await decks.listDecks(caller, {});

    expect(reply.text).toContain('The user has 1 deck:');
    expect(reply.text).toContain(`id: ${DECK_ID}`);
    expect(reply.structuredContent).toEqual({
      decks: [
        {
          id: DECK_ID,
          title: 'Spanish verbs',
          description: '',
          language: 'es',
          cardCount: 42,
          url: `https://deck.club/decks/${DECK_ID}`,
        },
      ],
      deckCount: 1,
      libraryUrl: 'https://deck.club/decks',
    });
  });

  it('asks the API as the caller, so it can only ever see that user’s decks', async () => {
    const api = new FakeDecksApi()
      .withDecks('token-ana', [SPANISH])
      .withDecks('token-ben', [testDeck({ id: CARD_ID, title: 'Ben’s deck' })]);
    const { decks } = createDecksService(api);

    const reply = await decks.listDecks(
      testCaller({ accessToken: 'token-ben', userId: 'user-ben' }),
      {},
    );

    expect(reply.text).not.toContain('Spanish verbs');
    expect(api.callers.map((each) => each.accessToken)).toEqual(['token-ben']);
  });

  it('guides the AI when the user has no decks yet', async () => {
    const { decks } = createDecksService();

    const reply = await decks.listDecks(caller, {});

    expect(reply.text).toBe('The user has no decks yet. Offer to create one with create_deck.');
    expect(reply.structuredContent).toMatchObject({ deckCount: 0, decks: [] });
  });

  it('relays the API’s refusal when it rejects the caller’s token', async () => {
    const api = new FakeDecksApi().failWith(
      new DeckClubError('UNAUTHENTICATED', 'Your session has expired. Sign in again.'),
    );

    await expect(createDecksService(api).decks.listDecks(caller, {})).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    });
  });

  it('relays the API being unreachable instead of pretending the library is empty', async () => {
    const api = new FakeDecksApi().failWith(
      new DeckClubError('UPSTREAM_UNAVAILABLE', 'Deck Club is not reachable right now.'),
    );

    await expect(createDecksService(api).decks.listDecks(caller, {})).rejects.toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
    });
  });

  it('records the call without any deck title', async () => {
    const log = vi.spyOn(Logger.prototype, 'log').mockReturnValue(undefined);
    const { decks } = createDecksService(
      new FakeDecksApi().withDecks(caller.accessToken, [SPANISH]),
    );

    await decks.listDecks(caller, {});

    expect(log).toHaveBeenCalledWith({ evt: 'decks.listed', user: 'user-ana', deckCount: 1 });
    expect(JSON.stringify(log.mock.calls)).not.toContain('Spanish');
  });
});

describe('DecksService.getDeck', () => {
  const cards = Array.from({ length: 30 }, (_, index) =>
    testCard({
      id: `00000000-0000-4000-8000-${String(index + 100).padStart(12, '0')}`,
      deckId: DECK_ID,
      front: `front ${index + 1}`,
    }),
  );
  const library = (): FakeDecksApi =>
    new FakeDecksApi()
      .withDecks(caller.accessToken, [{ ...SPANISH, cardCount: cards.length }])
      .withCards(DECK_ID, cards);

  it('answers with the deck and its first page, as text and as data for the view', async () => {
    const { decks } = createDecksService(library());

    const reply = await decks.getDeck(caller, { deckId: DECK_ID });

    expect(reply.text).toContain('Deck "Spanish verbs"');
    expect(reply.text).toContain('Cards 1–25 of 30:');
    expect(reply.structuredContent).toMatchObject({
      deck: { id: DECK_ID, title: 'Spanish verbs', cardCount: 30 },
      firstCardNumber: 1,
      nextCursor: expect.any(String) as string,
    });
    expect((reply.structuredContent as { cards: unknown[] }).cards).toHaveLength(25);
  });

  it('reads the next page with the cursor of the previous one', async () => {
    const { decks } = createDecksService(library());
    const first = await decks.getDeck(caller, { deckId: DECK_ID });
    const cursor = (first.structuredContent as { nextCursor: string }).nextCursor;

    const second = await decks.getDeck(caller, { deckId: DECK_ID, cursor });

    expect(second.structuredContent).toMatchObject({ firstCardNumber: 26, nextCursor: null });
    expect(second.text).toContain('26. [basic] front: front 26');
  });

  it('asks the API as the caller, so another user’s deck is not found', async () => {
    const api = library();
    const { decks } = createDecksService(api);
    const ben = testCaller({ accessToken: 'token-ben', userId: 'user-ben' });

    await expect(decks.getDeck(ben, { deckId: DECK_ID })).rejects.toMatchObject({
      code: 'DECK_NOT_FOUND',
    });
    expect(api.callers.every((each) => each.accessToken === 'token-ben')).toBe(true);
  });

  it('refuses a made-up cursor before calling the API', async () => {
    const api = library();
    const { decks } = createDecksService(api);

    await expect(
      decks.getDeck(caller, { deckId: DECK_ID, cursor: 'page-2' }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
    expect(api.callers).toHaveLength(0);
  });

  it('relays the API’s refusal when it rejects the caller’s token', async () => {
    const api = library().failWith(
      new DeckClubError('UNAUTHENTICATED', 'Your session has expired. Sign in again.'),
    );

    await expect(
      createDecksService(api).decks.getDeck(caller, { deckId: DECK_ID }),
    ).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    });
  });

  it('records which page was read, without any card content', async () => {
    const log = vi.spyOn(Logger.prototype, 'log').mockReturnValue(undefined);
    const { decks } = createDecksService(library());

    await decks.getDeck(caller, { deckId: DECK_ID });

    expect(log).toHaveBeenCalledWith({
      evt: 'decks.read',
      user: 'user-ana',
      deck: DECK_ID,
      firstCard: 1,
      cardsShown: 25,
      cardCount: 30,
    });
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/front \d|Spanish/);
  });
});

describe('DecksService.searchCards', () => {
  const withHits = (): FakeDecksApi =>
    new FakeDecksApi()
      .withDecks(caller.accessToken, [SPANISH])
      .withSearchResult(testSearchResult([testHit(1), testHit(2)], 7));

  it('answers with the matches, as text and as data for the view', async () => {
    const { decks } = createDecksService(withHits());

    const reply = await decks.searchCards(caller, { query: 'hablar', limit: 2 });

    expect(reply.text).toContain('7 cards match "hablar" across all decks:');
    expect(reply.structuredContent).toMatchObject({
      query: 'hablar',
      deckId: null,
      totalMatches: 7,
    });
    expect((reply.structuredContent as { matches: unknown[] }).matches).toHaveLength(2);
  });

  it('asks the API as the caller with the words, the deck and the limit', async () => {
    const api = withHits();

    await createDecksService(api).decks.searchCards(caller, {
      query: 'hablar',
      deckId: DECK_ID,
      limit: 5,
    });

    expect(api.searches).toEqual([{ q: 'hablar', deckId: DECK_ID, limit: 5 }]);
    expect(api.callers.map((each) => each.accessToken)).toEqual(['token-ana']);
  });

  it('refuses a deck filter naming another user’s deck with DECK_NOT_FOUND', async () => {
    const { decks } = createDecksService(withHits());
    const ben = testCaller({ accessToken: 'token-ben', userId: 'user-ben' });

    await expect(
      decks.searchCards(ben, { query: 'hablar', deckId: DECK_ID, limit: 20 }),
    ).rejects.toMatchObject({
      code: 'DECK_NOT_FOUND',
    });
  });

  it('relays the API being unreachable instead of claiming nothing matched', async () => {
    const api = withHits().failWith(
      new DeckClubError('UPSTREAM_UNAVAILABLE', 'Deck Club is not reachable.'),
    );

    await expect(
      createDecksService(api).decks.searchCards(caller, { query: 'x', limit: 20 }),
    ).rejects.toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
    });
  });

  it('records the search by counts only, never its words', async () => {
    const log = vi.spyOn(Logger.prototype, 'log').mockReturnValue(undefined);
    const { decks } = createDecksService(withHits());

    await decks.searchCards(caller, { query: 'secret diagnosis', limit: 2 });

    expect(log).toHaveBeenCalledWith({
      evt: 'cards.searched',
      user: 'user-ana',
      scope: 'all',
      words: 2,
      matches: 7,
      shown: 2,
    });
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/secret|diagnosis|hablar/);
  });
});

describe('DecksService.createDeck', () => {
  const INPUT = { title: 'Spanish verbs', description: 'A1', language: 'es', tags: ['a1'] };

  it('answers with the new deck, as text and as data for the view', async () => {
    const { decks } = createDecksService();

    const reply = await decks.createDeck(caller, INPUT);

    expect(reply.text).toMatch(
      /^Created the private deck "Spanish verbs" \(id: [0-9a-f-]{36}, language: es, tags: a1\)\./,
    );
    expect(reply.structuredContent).toMatchObject({
      deck: {
        title: 'Spanish verbs',
        language: 'es',
        tags: ['a1'],
        visibility: 'private',
        cardCount: 0,
      },
      libraryUrl: 'https://deck.club/decks',
    });
  });

  it('creates it as the caller, with exactly the validated input', async () => {
    const api = new FakeDecksApi();

    await createDecksService(api).decks.createDeck(caller, INPUT);

    expect(api.created).toEqual([INPUT]);
    expect(api.callers.map((each) => each.accessToken)).toEqual(['token-ana']);
  });

  it('relays the API’s field problems, so the AI can correct its call', async () => {
    const api = new FakeDecksApi().failWith(
      new DeckClubError('VALIDATION_FAILED', 'The request body is invalid.', [
        { path: 'language', message: 'Use a language code such as en, sk or pt-BR.' },
      ]),
    );

    await expect(createDecksService(api).decks.createDeck(caller, INPUT)).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
      issues: [{ path: 'language' }],
    });
  });

  it('relays a rejected token', async () => {
    const api = new FakeDecksApi().failWith(new DeckClubError('UNAUTHENTICATED', 'Sign in again.'));

    await expect(createDecksService(api).decks.createDeck(caller, INPUT)).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    });
  });

  it('records the new deck by id and counts, never its title or description', async () => {
    const log = vi.spyOn(Logger.prototype, 'log').mockReturnValue(undefined);
    const { decks } = createDecksService();

    await decks.createDeck(caller, {
      ...INPUT,
      title: 'My diagnosis notes',
      description: 'private',
    });

    expect(log).toHaveBeenCalledWith({
      evt: 'decks.created',
      user: 'user-ana',
      deck: expect.stringMatching(/^[0-9a-f-]{36}$/) as string,
      language: 'es',
      tags: 1,
      client: 'Claude',
    });
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/diagnosis|private/);
  });
});

describe('DecksService (interface only, not built yet)', () => {
  const { decks } = createDecksService();

  it.each([
    ['add_cards', () => decks.addCards(caller, { deckId: DECK_ID, cards: [] })],
    [
      'update_card',
      () => decks.updateCard(caller, { deckId: DECK_ID, cardId: CARD_ID, back: 'hi' }),
    ],
    ['delete_cards', () => decks.deleteCards(caller, { deckId: DECK_ID, cardIds: [CARD_ID] })],
    ['deck resource', () => decks.readDeck(caller, DECK_ID)],
    ['card-writing guide', () => decks.readCardWritingGuide()],
    ['Make cards from this', () => decks.makeCardsPrompt({ source: 'notes' })],
  ])('%s refuses with NOT_IMPLEMENTED', async (capability, call) => {
    await expect(call()).rejects.toMatchObject({
      code: 'NOT_IMPLEMENTED',
      detail: expect.stringContaining(capability) as string,
    });
  });
});
