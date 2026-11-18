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

  it('sends the AI’s idempotency key apart from the deck, which never carries it', async () => {
    const api = new FakeDecksApi();

    await createDecksService(api).decks.createDeck(caller, {
      ...INPUT,
      idempotencyKey: 'create-key-0001',
    });

    expect(api.created).toEqual([INPUT]);
    expect(api.idempotencyKeys).toEqual(['create-key-0001']);
  });

  it('creates one deck when the AI retries with the same key, and says so', async () => {
    const api = new FakeDecksApi();
    const { decks } = createDecksService(api);
    const first = await decks.createDeck(caller, { ...INPUT, idempotencyKey: 'create-key-0001' });

    const retry = await decks.createDeck(caller, { ...INPUT, idempotencyKey: 'create-key-0001' });

    expect(retry.text).toMatch(
      /^Already done: an earlier create_deck call with this idempotencyKey created this deck, so no second deck was made\.\nCreated the private deck "Spanish verbs"/,
    );
    expect(retry.structuredContent).toEqual(first.structuredContent);
    await expect(api.listDecks(caller)).resolves.toHaveLength(1);
  });

  it('refuses the same key for another deck, in the words of the tool’s argument', async () => {
    const { decks } = createDecksService();
    await decks.createDeck(caller, { ...INPUT, idempotencyKey: 'create-key-0001' });

    await expect(
      decks.createDeck(caller, { ...INPUT, title: 'French', idempotencyKey: 'create-key-0001' }),
    ).rejects.toMatchObject({
      code: 'IDEMPOTENCY_KEY_REUSED',
      detail: expect.stringContaining('Use a new key for a new create_deck call') as string,
    });
  });

  it('tells the AI how to retry an unconfirmed create, with and without a key', async () => {
    const api = new FakeDecksApi().failWith(
      new DeckClubError('UPSTREAM_UNAVAILABLE', 'Deck Club is not reachable right now.'),
    );
    const { decks } = createDecksService(api);

    await expect(
      decks.createDeck(caller, { ...INPUT, idempotencyKey: 'create-key-0001' }),
    ).rejects.toMatchObject({
      detail: expect.stringContaining(
        'Call create_deck again with exactly the same arguments and the same idempotencyKey',
      ) as string,
    });
    await expect(decks.createDeck(caller, INPUT)).rejects.toMatchObject({
      detail: expect.stringContaining('call list_decks to check whether it exists') as string,
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
      replayed: false,
    });
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/diagnosis|private/);
  });
});

describe('DecksService.addCards', () => {
  const KEY = 'batch-key-0001';
  const EXISTING = [testCard({ id: CARD_ID, deckId: DECK_ID, front: 'ser', back: 'to be' })];
  const CARDS = [
    { type: 'reversible' as const, front: 'hablar', back: 'to speak', extra: '', tags: ['verbs'] },
    { type: 'basic' as const, front: 'comer', back: 'to eat', extra: 'yo como', tags: [] },
  ];
  const INPUT = { deckId: DECK_ID, cards: CARDS };
  const library = (): FakeDecksApi =>
    new FakeDecksApi()
      .withDecks(caller.accessToken, [{ ...SPANISH, cardCount: EXISTING.length }])
      .withCards(DECK_ID, EXISTING);

  it('answers with the new card ids for the AI and the deck page they start on for the view', async () => {
    const { decks } = createDecksService(library());

    const reply = await decks.addCards(caller, INPUT);

    expect(reply.text).toMatch(
      /^Added 2 cards to the deck "Spanish verbs" \(id: [0-9a-f-]{36}\); it now has 3 cards\./,
    );
    expect(reply.text).toMatch(/^- [0-9a-f-]{36}: \[reversible\] hablar$/m);
    expect(reply.text).toContain(
      `Share the link with the user: https://deck.club/decks/${DECK_ID}`,
    );
    expect(reply.structuredContent).toMatchObject({
      deck: { id: DECK_ID, title: 'Spanish verbs', cardCount: 3 },
      cards: [
        { front: 'hablar', type: 'reversible', tags: ['verbs'], addedBy: 'Claude' },
        { front: 'comer', extra: 'yo como', addedBy: 'Claude' },
      ],
      firstCardNumber: 2,
      nextCursor: null,
      addedCount: 2,
    });
  });

  it('writes exactly the validated cards, as the caller, without the idempotency key', async () => {
    const api = library();

    await createDecksService(api).decks.addCards(caller, {
      ...INPUT,
      idempotencyKey: 'retry-key-0001',
    });

    expect(api.batches).toEqual([{ deckId: DECK_ID, input: { cards: CARDS } }]);
    expect(api.callers.every((each) => each.accessToken === 'token-ana')).toBe(true);
  });

  it('refuses another user’s deck with DECK_NOT_FOUND before writing anything', async () => {
    const api = library();
    const ben = testCaller({ accessToken: 'token-ben', userId: 'user-ben' });

    await expect(createDecksService(api).decks.addCards(ben, INPUT)).rejects.toMatchObject({
      code: 'DECK_NOT_FOUND',
    });
    expect(api.batches).toEqual([]);
  });

  it('relays the API’s field problems, so the AI can fix the card it names', async () => {
    const api = library().failWritesWith(
      new DeckClubError('VALIDATION_FAILED', 'The request body is invalid.', [
        { path: 'cards.1.front', message: 'Text must be plain: HTML tags are not allowed.' },
      ]),
    );

    await expect(createDecksService(api).decks.addCards(caller, INPUT)).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
      issues: [{ path: 'cards.1.front' }],
    });
  });

  it('relays a rejected token', async () => {
    const api = library().failWith(new DeckClubError('UNAUTHENTICATED', 'Sign in again.'));

    await expect(createDecksService(api).decks.addCards(caller, INPUT)).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    });
  });

  it('tells the AI to check the deck before retrying an unconfirmed write sent without a key', async () => {
    const api = library().failWritesWith(
      new DeckClubError('UPSTREAM_UNAVAILABLE', 'Deck Club is not reachable right now.'),
    );

    await expect(createDecksService(api).decks.addCards(caller, INPUT)).rejects.toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
      detail: expect.stringMatching(/did not confirm .* call get_deck to check/) as string,
    });
  });

  it('tells the AI to send an unconfirmed write again with the same key, which is safe', async () => {
    const api = library().failWritesWith(
      new DeckClubError('UPSTREAM_UNAVAILABLE', 'Deck Club is not reachable right now.'),
    );

    await expect(
      createDecksService(api).decks.addCards(caller, { ...INPUT, idempotencyKey: KEY }),
    ).rejects.toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
      detail: expect.stringMatching(
        /Call add_cards again with exactly the same arguments and the same idempotencyKey/,
      ) as string,
    });
  });

  it('sends the AI’s idempotency key with the batch, and no key when it gave none', async () => {
    const api = library();
    const { decks } = createDecksService(api);

    await decks.addCards(caller, { ...INPUT, idempotencyKey: KEY });
    await decks.addCards(caller, INPUT);

    expect(api.idempotencyKeys).toEqual([KEY, undefined]);
    expect(api.batches.map((batch) => batch.input)).toEqual([{ cards: CARDS }, { cards: CARDS }]);
  });

  it('adds the cards once when the AI retries with the same key, and says so', async () => {
    const log = vi.spyOn(Logger.prototype, 'log').mockReturnValue(undefined);
    const { decks } = createDecksService(library());
    const first = await decks.addCards(caller, { ...INPUT, idempotencyKey: KEY });

    const retry = await decks.addCards(caller, { ...INPUT, idempotencyKey: KEY });

    expect(retry.text).toMatch(
      /^Already done: an earlier add_cards call with this idempotencyKey added these cards, so none were added twice\.\nAdded 2 cards to the deck "Spanish verbs" .*; it now has 3 cards\./,
    );
    expect(retry.structuredContent).toEqual(first.structuredContent);
    expect(log).toHaveBeenLastCalledWith(
      expect.objectContaining({ evt: 'cards.added', replayed: true }),
    );
    expect(JSON.stringify(log.mock.calls)).not.toContain(KEY);
  });

  it('refuses the same key with other cards, in the words of the tool’s argument', async () => {
    const { decks } = createDecksService(library());
    await decks.addCards(caller, { ...INPUT, idempotencyKey: KEY });

    await expect(
      decks.addCards(caller, { ...INPUT, cards: [CARDS[0]!], idempotencyKey: KEY }),
    ).rejects.toMatchObject({
      code: 'IDEMPOTENCY_KEY_REUSED',
      detail:
        'This idempotencyKey was already used for a different call. Use a new key for a new add_cards call; reuse a key only to retry exactly the same call.',
    });
  });

  it('tells the AI to wait while an earlier call with the key still runs', async () => {
    const api = library().failWritesWith(
      new DeckClubError(
        'IDEMPOTENCY_KEY_IN_USE',
        'A request with this Idempotency-Key is still running.',
      ),
    );

    await expect(
      createDecksService(api).decks.addCards(caller, { ...INPUT, idempotencyKey: KEY }),
    ).rejects.toMatchObject({
      code: 'IDEMPOTENCY_KEY_IN_USE',
      detail: expect.stringMatching(
        /^An earlier add_cards call with this idempotencyKey is still running/,
      ) as string,
    });
  });

  it('still reports the cards as added when the deck cannot be read back after the write', async () => {
    const warn = vi.spyOn(Logger.prototype, 'warn').mockReturnValue(undefined);
    const api = library().failListingCardsWith(
      new DeckClubError('UPSTREAM_UNAVAILABLE', 'Deck Club is not reachable right now.'),
    );

    const reply = await createDecksService(api).decks.addCards(caller, INPUT);

    expect(reply.text).toMatch(/^Added 2 cards to the deck "Spanish verbs"/);
    expect(reply.structuredContent).toMatchObject({
      deck: { cardCount: 3 },
      cards: [{ front: 'hablar' }, { front: 'comer' }],
      firstCardNumber: 2,
      nextCursor: null,
      addedCount: 2,
    });
    expect(warn).toHaveBeenCalledWith({
      evt: 'cards.added.read_back_failed',
      user: 'user-ana',
      deck: DECK_ID,
      code: 'UPSTREAM_UNAVAILABLE',
    });
  });

  it('records the write by deck and count, never the cards’ content', async () => {
    const log = vi.spyOn(Logger.prototype, 'log').mockReturnValue(undefined);
    const { decks } = createDecksService(library());

    await decks.addCards(caller, {
      deckId: DECK_ID,
      cards: [{ type: 'basic', front: 'my diagnosis', back: 'secret', extra: '', tags: [] }],
    });

    expect(log).toHaveBeenCalledWith({
      evt: 'cards.added',
      user: 'user-ana',
      deck: DECK_ID,
      added: 1,
      client: 'Claude',
      replayed: false,
    });
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/diagnosis|secret|Spanish/);
  });
});

describe('DecksService.updateCard', () => {
  const HABLAR = testCard({
    id: CARD_ID,
    deckId: DECK_ID,
    front: 'hablar',
    back: 'to speak',
    tags: ['verbs'],
    provenance: { source: 'mcp', clientName: 'Claude' },
  });
  const library = (): FakeDecksApi =>
    new FakeDecksApi()
      .withDecks(caller.accessToken, [{ ...SPANISH, cardCount: 1 }])
      .withCards(DECK_ID, [HABLAR]);
  const EDIT = {
    deckId: DECK_ID,
    cardId: CARD_ID,
    back: 'to speak, to talk',
    tags: ['verbs', 'a1'],
  };

  it('answers with the card as it is now and as it was, for the AI and the view', async () => {
    const { decks } = createDecksService(library());

    const reply = await decks.updateCard(caller, EDIT);

    expect(reply.text.split('\n').slice(0, 3)).toEqual([
      `Updated the card ${CARD_ID} in the deck "Spanish verbs" (id: ${DECK_ID}). The user's study progress on it is kept.`,
      '- back: "to speak" → "to speak, to talk"',
      '- tags: verbs → verbs, a1',
    ]);
    expect(reply.structuredContent).toMatchObject({
      deck: { id: DECK_ID, title: 'Spanish verbs', url: `https://deck.club/decks/${DECK_ID}` },
      card: { id: CARD_ID, back: 'to speak, to talk', tags: ['verbs', 'a1'], addedBy: 'Claude' },
      previous: { back: 'to speak', tags: ['verbs'] },
      changedFields: ['back', 'tags'],
    });
  });

  it('sends only the fields to change, as the caller', async () => {
    const api = library();

    await createDecksService(api).decks.updateCard(caller, {
      deckId: DECK_ID,
      cardId: CARD_ID,
      front: 'hablar (v.)',
    });

    expect(api.updates).toEqual([
      { deckId: DECK_ID, cardId: CARD_ID, patch: { front: 'hablar (v.)' } },
    ]);
    expect(api.callers.every((each) => each.accessToken === 'token-ana')).toBe(true);
  });

  it('refuses a card that is not in the deck with CARD_NOT_FOUND, before writing', async () => {
    const api = library();

    await expect(
      createDecksService(api).decks.updateCard(caller, {
        ...EDIT,
        cardId: '00000000-0000-4000-8000-0000000000ff',
      }),
    ).rejects.toMatchObject({
      code: 'CARD_NOT_FOUND',
      detail: expect.stringContaining('get_deck or search_cards') as string,
    });
    expect(api.updates).toEqual([]);
  });

  it('refuses another user’s deck with DECK_NOT_FOUND, before writing', async () => {
    const api = library();
    const ben = testCaller({ accessToken: 'token-ben', userId: 'user-ben' });

    await expect(createDecksService(api).decks.updateCard(ben, EDIT)).rejects.toMatchObject({
      code: 'DECK_NOT_FOUND',
    });
    expect(api.updates).toEqual([]);
  });

  it('relays the API’s field problems, so the AI can fix its call', async () => {
    const api = library().failWritesWith(
      new DeckClubError('VALIDATION_FAILED', 'The request body is invalid.', [
        { path: 'back', message: 'Too long' },
      ]),
    );

    await expect(createDecksService(api).decks.updateCard(caller, EDIT)).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
      issues: [{ path: 'back' }],
    });
  });

  it('tells the AI a retry is safe when the edit was not confirmed', async () => {
    const api = library().failWritesWith(
      new DeckClubError('UPSTREAM_UNAVAILABLE', 'Deck Club is not reachable right now.'),
    );

    await expect(createDecksService(api).decks.updateCard(caller, EDIT)).rejects.toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
      detail:
        'Deck Club did not confirm that the card was updated. Calling update_card again with the same arguments is safe: it sets the same values.',
    });
  });

  it('says so when the card already had the values it was given', async () => {
    const { decks } = createDecksService(library());

    const reply = await decks.updateCard(caller, {
      deckId: DECK_ID,
      cardId: CARD_ID,
      back: 'to speak',
    });

    expect(reply.text).toMatch(/already had these values; nothing changed\./);
    expect(reply.structuredContent).toMatchObject({ changedFields: [] });
  });

  it('records which fields changed, never their content', async () => {
    const log = vi.spyOn(Logger.prototype, 'log').mockReturnValue(undefined);
    const { decks } = createDecksService(library());

    await decks.updateCard(caller, { deckId: DECK_ID, cardId: CARD_ID, back: 'my diagnosis' });

    expect(log).toHaveBeenCalledWith({
      evt: 'cards.updated',
      user: 'user-ana',
      deck: DECK_ID,
      card: CARD_ID,
      changed: ['back'],
      client: 'Claude',
    });
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/diagnosis|hablar|to speak/);
  });
});

describe('DecksService.deleteCards', () => {
  const id = (index: number): string =>
    `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
  const CARDS = [1, 2, 3].map((index) =>
    testCard({ id: id(index), deckId: DECK_ID, front: `front ${index}`, back: `back ${index}` }),
  );
  const library = (): FakeDecksApi =>
    new FakeDecksApi()
      .withDecks(caller.accessToken, [{ ...SPANISH, cardCount: CARDS.length }])
      .withCards(DECK_ID, CARDS);

  it('deletes the cards and answers with them as they were, for the AI and the view', async () => {
    const api = library();

    const reply = await createDecksService(api).decks.deleteCards(caller, {
      deckId: DECK_ID,
      cardIds: [id(1), id(3)],
    });

    expect(reply.text.split('\n').slice(0, 4)).toEqual([
      `Deleted 2 cards from the deck "Spanish verbs" (id: ${DECK_ID}); it now has 1 card.`,
      'The deleted cards, as they were:',
      `- ${id(1)}: [basic] front: front 1 | back: back 1`,
      `- ${id(3)}: [basic] front: front 3 | back: back 3`,
    ]);
    expect(reply.structuredContent).toMatchObject({
      deck: { id: DECK_ID, cardCount: 1 },
      deleted: [{ id: id(1), front: 'front 1' }, { id: id(3) }],
      notFound: [],
      notDeleted: [],
    });
    await expect(api.listCards(caller, DECK_ID)).resolves.toEqual([CARDS[1]]);
  });

  it('deletes each card once, as the caller, even when an id is repeated', async () => {
    const api = library();

    await createDecksService(api).decks.deleteCards(caller, {
      deckId: DECK_ID,
      cardIds: [id(2), id(2)],
    });

    expect(api.deletions).toEqual([{ deckId: DECK_ID, cardId: id(2) }]);
    expect(api.callers.every((each) => each.accessToken === 'token-ana')).toBe(true);
  });

  it('reports ids not in the deck instead of refusing, and deletes the rest', async () => {
    const api = library();
    const unknown = id(99);

    const reply = await createDecksService(api).decks.deleteCards(caller, {
      deckId: DECK_ID,
      cardIds: [unknown, id(1)],
    });

    expect(api.deletions.map((each) => each.cardId)).toEqual([id(1)]);
    expect(reply.structuredContent).toMatchObject({
      deleted: [{ id: id(1) }],
      notFound: [unknown],
    });
    expect(reply.text).toContain(`Not in this deck (already deleted, or never there): ${unknown}`);
  });

  it('answers a retry of a finished delete with nothing deleted, not a refusal', async () => {
    const { decks } = createDecksService(library());
    await decks.deleteCards(caller, { deckId: DECK_ID, cardIds: [id(1)] });

    const retry = await decks.deleteCards(caller, { deckId: DECK_ID, cardIds: [id(1)] });

    expect(retry.text).toMatch(/^No cards were deleted from the deck "Spanish verbs"/);
    expect(retry.structuredContent).toMatchObject({ deleted: [], notFound: [id(1)] });
  });

  it('counts a card the API no longer finds as not found', async () => {
    const api = library();
    const deleteCard = api.deleteCard.bind(api);
    vi.spyOn(api, 'deleteCard').mockImplementation((who, card) =>
      card.cardId === id(1)
        ? Promise.reject(
            new DeckClubError('CARD_NOT_FOUND', 'No card with that id exists in this deck.'),
          )
        : deleteCard(who, card),
    );

    const reply = await createDecksService(api).decks.deleteCards(caller, {
      deckId: DECK_ID,
      cardIds: [id(1), id(2)],
    });

    expect(reply.structuredContent).toMatchObject({
      deleted: [{ id: id(2) }],
      notFound: [id(1)],
      notDeleted: [],
    });
  });

  it('still reports what it deleted when Deck Club stops part-way, and lists the rest', async () => {
    const warn = vi.spyOn(Logger.prototype, 'warn').mockReturnValue(undefined);
    const api = library().failDeletesAfter(
      1,
      new DeckClubError('UPSTREAM_UNAVAILABLE', 'Deck Club is not reachable right now.'),
    );

    const reply = await createDecksService(api).decks.deleteCards(caller, {
      deckId: DECK_ID,
      cardIds: [id(1), id(2), id(99), id(3)],
    });

    expect(reply.structuredContent).toMatchObject({
      deck: { cardCount: 2 },
      deleted: [{ id: id(1) }],
      notFound: [id(99)],
      notDeleted: [id(2), id(3)],
    });
    expect(reply.text).toContain('Calling delete_cards again with these ids is safe.');
    expect(api.deletions.map((each) => each.cardId)).toEqual([id(1), id(2)]);
    expect(warn).toHaveBeenCalledWith({
      evt: 'cards.delete_stopped',
      user: 'user-ana',
      deck: DECK_ID,
      deleted: 1,
      code: 'UPSTREAM_UNAVAILABLE',
    });
  });

  it('refuses, saying a retry is safe, when Deck Club deleted nothing before stopping', async () => {
    vi.spyOn(Logger.prototype, 'warn').mockReturnValue(undefined);
    const api = library().failDeletesAfter(
      0,
      new DeckClubError('UPSTREAM_UNAVAILABLE', 'Deck Club is not reachable right now.'),
    );

    await expect(
      createDecksService(api).decks.deleteCards(caller, { deckId: DECK_ID, cardIds: [id(1)] }),
    ).rejects.toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
      detail:
        'Deck Club did not confirm that the cards were deleted. Calling delete_cards again with the same arguments is safe: cards already deleted are reported as not found.',
    });
  });

  it('refuses another user’s deck with DECK_NOT_FOUND, before deleting anything', async () => {
    const api = library();
    const ben = testCaller({ accessToken: 'token-ben', userId: 'user-ben' });

    await expect(
      createDecksService(api).decks.deleteCards(ben, { deckId: DECK_ID, cardIds: [id(1)] }),
    ).rejects.toMatchObject({ code: 'DECK_NOT_FOUND' });
    expect(api.deletions).toEqual([]);
  });

  it('records the counts, never the cards’ content', async () => {
    const log = vi.spyOn(Logger.prototype, 'log').mockReturnValue(undefined);
    const { decks } = createDecksService(library());

    await decks.deleteCards(caller, { deckId: DECK_ID, cardIds: [id(1), id(99)] });

    expect(log).toHaveBeenCalledWith({
      evt: 'cards.deleted',
      user: 'user-ana',
      deck: DECK_ID,
      deleted: 1,
      notFound: 1,
      notDeleted: 0,
      client: 'Claude',
    });
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/front 1|back 1|Spanish/);
  });
});

describe('DecksService (interface only, not built yet)', () => {
  const { decks } = createDecksService();

  it.each([
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
