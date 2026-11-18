import type { Client } from '@modelcontextprotocol/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DeckClubError } from '../../../common/errors/deck-club-error.js';
import { WIDGET_URIS } from '../../../common/mcp/widgets.js';
import { connectFeature, testCaller, textOf } from '../../../common/mcp/testing/mcp-test-client.js';
import type { DecksService } from '../application/decks.service.js';
import { createDecksService } from '../testing/decks-test-kit.js';
import { FakeDecksApi, testCard, testDeck } from '../testing/fake-decks-api.js';
import { testHit, testSearchResult } from '../testing/search-hits.js';
import { DecksMcpFeature } from './decks.mcp-feature.js';

const DECK_ID = '00000000-0000-4000-8000-000000000001';
let client: Client | undefined;

const newService = (): DecksService => createDecksService().decks;

async function connect(service = newService(), caller = testCaller()): Promise<Client> {
  client = await connectFeature(new DecksMcpFeature(service), caller);
  return client;
}

afterEach(async () => {
  await client?.close();
  client = undefined;
});

describe('DecksMcpFeature tools', () => {
  it('publishes the seven deck and card tools, each described for the AI', async () => {
    const { tools } = await (await connect()).listTools();

    expect(tools.map((tool) => tool.name).sort()).toEqual([
      'add_cards',
      'create_deck',
      'delete_cards',
      'get_deck',
      'list_decks',
      'search_cards',
      'update_card',
    ]);
    for (const tool of tools) {
      expect(tool.title).toBeTruthy();
      expect(tool.description?.length).toBeGreaterThan(40);
      expect(tool.inputSchema.type).toBe('object');
    }
  });

  it('marks reads as read-only and deletion as destructive', async () => {
    const { tools } = await (await connect()).listTools();
    const byName = new Map(tools.map((tool) => [tool.name, tool]));

    expect(byName.get('list_decks')?.annotations).toMatchObject({
      readOnlyHint: true,
      openWorldHint: false,
    });
    expect(byName.get('delete_cards')?.annotations).toMatchObject({
      readOnlyHint: false,
      destructiveHint: true,
    });
  });

  it('links each tool that has one to its MCP Apps view', async () => {
    const { tools } = await (await connect()).listTools();
    const views = tools
      .filter((tool) => tool._meta?.ui !== undefined)
      .map((tool) => [tool.name, (tool._meta?.ui as { resourceUri?: string }).resourceUri]);

    expect(views.sort()).toEqual([
      ['add_cards', WIDGET_URIS.cardsAdded],
      ['create_deck', WIDGET_URIS.deckCreated],
      ['delete_cards', WIDGET_URIS.cardsDeleted],
      ['get_deck', WIDGET_URIS.deck],
      ['list_decks', WIDGET_URIS.deckLibrary],
      ['search_cards', WIDGET_URIS.searchResults],
      ['update_card', WIDGET_URIS.cardUpdated],
    ]);
  });

  it('declares what list_decks returns, so its view gets a checked shape', async () => {
    const { tools } = await (await connect()).listTools();
    const listDecks = tools.find((tool) => tool.name === 'list_decks');

    expect(listDecks?.outputSchema).toMatchObject({ type: 'object' });
    expect(Object.keys((listDecks?.outputSchema as { properties: object }).properties)).toEqual([
      'decks',
      'deckCount',
      'libraryUrl',
    ]);
  });

  it('builds every deck tool: none answers NOT_IMPLEMENTED any more', async () => {
    const connected = await connect();
    const calls = [
      { name: 'list_decks', arguments: {} },
      { name: 'get_deck', arguments: { deckId: DECK_ID } },
      { name: 'search_cards', arguments: { query: 'x' } },
      { name: 'create_deck', arguments: { title: 'x' } },
      { name: 'add_cards', arguments: { deckId: DECK_ID, cards: [{ front: 'q', back: 'a' }] } },
      { name: 'update_card', arguments: { deckId: DECK_ID, cardId: DECK_ID, back: 'a' } },
      { name: 'delete_cards', arguments: { deckId: DECK_ID, cardIds: [DECK_ID] } },
    ];

    const results = await Promise.all(calls.map((call) => connected.callTool(call)));

    for (const result of results) expect(textOf(result)).not.toContain('NOT_IMPLEMENTED');
  });

  it('answers list_decks with the library as text and as structured content', async () => {
    const { decks } = createDecksService(
      new FakeDecksApi().withDecks('token-ana', [
        testDeck({ id: DECK_ID, title: 'Spanish verbs', cardCount: 3 }),
      ]),
    );

    const result = await (await connect(decks)).callTool({ name: 'list_decks', arguments: {} });

    expect(result.isError).toBeFalsy();
    expect(textOf(result)).toContain('"Spanish verbs"');
    expect(result.structuredContent).toMatchObject({
      deckCount: 1,
      decks: [expect.objectContaining({ title: 'Spanish verbs', cardCount: 3 }) as object],
    });
  });

  it('passes the validated input, with defaults, and the caller to the use case', async () => {
    const service = newService();
    const added = {
      deck: {
        id: DECK_ID,
        title: 'Spanish verbs',
        description: '',
        language: 'es',
        cardCount: 1,
        url: `https://deck.club/decks/${DECK_ID}`,
      },
      cards: [],
      firstCardNumber: 1,
      nextCursor: null,
      addedCount: 1,
    };
    const addCards = vi.spyOn(service, 'addCards').mockResolvedValue({
      text: 'Added 1 card.',
      structuredContent: added,
    });

    const result = await (
      await connect(service)
    ).callTool({
      name: 'add_cards',
      arguments: { deckId: DECK_ID, cards: [{ front: 'hola', back: 'hello' }] },
    });

    expect(result).toMatchObject({
      content: [{ type: 'text', text: 'Added 1 card.' }],
      structuredContent: added,
    });
    expect(addCards).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-ana' }), {
      deckId: DECK_ID,
      cards: [{ type: 'basic', front: 'hola', back: 'hello', extra: '', tags: [] }],
    });
  });

  it('refuses a write when the AI connection lacks decks:write', async () => {
    const service = newService();
    const createDeck = vi.spyOn(service, 'createDeck');

    const result = await (
      await connect(service, testCaller({ scopes: ['decks:read'] }))
    ).callTool({
      name: 'create_deck',
      arguments: { title: 'Spanish' },
    });

    expect(textOf(result)).toMatch(/^REJECTED: FORBIDDEN\. .*"decks:write"/);
    expect(createDeck).not.toHaveBeenCalled();
  });

  it('returns invalid arguments as a tool error without calling the use case', async () => {
    const service = newService();
    const getDeck = vi.spyOn(service, 'getDeck');

    const result = await (
      await connect(service)
    ).callTool({ name: 'get_deck', arguments: { deckId: 'spanish' } });

    expect(result.isError).toBe(true);
    expect(getDeck).not.toHaveBeenCalled();
  });
});

describe('DecksMcpFeature get_deck', () => {
  const withDeck = (): DecksService =>
    createDecksService(
      new FakeDecksApi()
        .withDecks('token-ana', [testDeck({ id: DECK_ID, title: 'Spanish verbs', cardCount: 1 })])
        .withCards(DECK_ID, [
          testCard({
            id: '00000000-0000-4000-8000-000000000009',
            deckId: DECK_ID,
            front: 'hablar',
            back: 'to speak',
            provenance: { source: 'mcp', clientName: 'Claude' },
          }),
        ]),
    ).decks;

  it('declares its output, so the deck view gets a checked shape', async () => {
    const { tools } = await (await connect()).listTools();
    const getDeck = tools.find((tool) => tool.name === 'get_deck');

    expect(Object.keys((getDeck?.outputSchema as { properties: object }).properties)).toEqual([
      'deck',
      'cards',
      'firstCardNumber',
      'nextCursor',
    ]);
  });

  it('answers with the deck and its cards, as text and as structured content', async () => {
    const result = await (
      await connect(withDeck())
    ).callTool({
      name: 'get_deck',
      arguments: { deckId: DECK_ID },
    });

    expect(result.isError).toBeFalsy();
    expect(textOf(result)).toContain('1. [basic] front: hablar | back: to speak | added by Claude');
    expect(result.structuredContent).toMatchObject({
      deck: { title: 'Spanish verbs' },
      cards: [{ front: 'hablar', addedBy: 'Claude' }],
      nextCursor: null,
    });
  });

  it('relays a deck that is not the caller’s as a REJECTED tool result', async () => {
    const result = await (
      await connect(withDeck(), testCaller({ accessToken: 'token-ben' }))
    ).callTool({
      name: 'get_deck',
      arguments: { deckId: DECK_ID },
    });

    expect(result.isError).toBe(true);
    expect(textOf(result)).toMatch(/^REJECTED: DECK_NOT_FOUND\./);
  });

  it('refuses a made-up cursor as a REJECTED tool result the AI can act on', async () => {
    const result = await (
      await connect(withDeck())
    ).callTool({
      name: 'get_deck',
      arguments: { deckId: DECK_ID, cursor: 'page-2' },
    });

    expect(textOf(result)).toMatch(/^REJECTED: VALIDATION_FAILED\. .*without a cursor/);
  });

  it('refuses the call without decks:read', async () => {
    const result = await (
      await connect(withDeck(), testCaller({ scopes: ['study'] }))
    ).callTool({
      name: 'get_deck',
      arguments: { deckId: DECK_ID },
    });

    expect(textOf(result)).toMatch(/^REJECTED: FORBIDDEN\. .*"decks:read"/);
  });
});

describe('DecksMcpFeature search_cards', () => {
  const withHits = (): DecksService =>
    createDecksService(new FakeDecksApi().withSearchResult(testSearchResult([testHit(1)]))).decks;

  it('declares its output and links the search results view', async () => {
    const { tools } = await (await connect()).listTools();
    const search = tools.find((tool) => tool.name === 'search_cards');

    expect(Object.keys((search?.outputSchema as { properties: object }).properties)).toEqual([
      'query',
      'deckId',
      'matches',
      'totalMatches',
    ]);
    expect(search?._meta?.ui).toMatchObject({ resourceUri: WIDGET_URIS.searchResults });
  });

  it('answers with the matches, as text and as structured content', async () => {
    const result = await (
      await connect(withHits())
    ).callTool({
      name: 'search_cards',
      arguments: { query: 'hablar' },
    });

    expect(textOf(result)).toContain('1 card matches "hablar" across all decks:');
    expect(result.structuredContent).toMatchObject({
      query: 'hablar',
      matches: [{ card: { front: 'hablar 1' }, deck: { title: 'Spanish verbs' } }],
    });
  });

  it('rejects a limit above 50 before calling the API', async () => {
    const result = await (
      await connect(withHits())
    ).callTool({
      name: 'search_cards',
      arguments: { query: 'hablar', limit: 51 },
    });

    expect(result.isError).toBe(true);
    expect(textOf(result)).not.toContain('REJECTED');
  });

  it('refuses the call without decks:read', async () => {
    const result = await (
      await connect(withHits(), testCaller({ scopes: ['decks:write'] }))
    ).callTool({
      name: 'search_cards',
      arguments: { query: 'hablar' },
    });

    expect(textOf(result)).toMatch(/^REJECTED: FORBIDDEN\. .*"decks:read"/);
  });
});

describe('DecksMcpFeature create_deck', () => {
  it('declares its output and links the deck created view', async () => {
    const { tools } = await (await connect()).listTools();
    const create = tools.find((tool) => tool.name === 'create_deck');

    expect(Object.keys((create?.outputSchema as { properties: object }).properties)).toEqual([
      'deck',
      'libraryUrl',
    ]);
    expect(create?._meta?.ui).toMatchObject({ resourceUri: WIDGET_URIS.deckCreated });
    expect(create?.annotations).toMatchObject({ readOnlyHint: false, destructiveHint: false });
  });

  it('creates the deck with the schema’s defaults and answers with it', async () => {
    const api = new FakeDecksApi();

    const result = await (
      await connect(createDecksService(api).decks)
    ).callTool({
      name: 'create_deck',
      arguments: { title: '  Biology  ' },
    });

    expect(api.created).toEqual([{ title: 'Biology', description: '', language: 'en', tags: [] }]);
    expect(textOf(result)).toMatch(/^Created the private deck "Biology"/);
    expect(result.structuredContent).toMatchObject({
      deck: { title: 'Biology', visibility: 'private' },
    });
  });

  it('forwards the idempotencyKey, and answers a retry with the same deck instead of a second one', async () => {
    const api = new FakeDecksApi();
    const connected = await connect(createDecksService(api).decks);
    const call = {
      name: 'create_deck',
      arguments: { title: 'Biology', idempotencyKey: 'create-key-0001' },
    };

    const first = await connected.callTool(call);
    const retry = await connected.callTool(call);

    expect(api.idempotencyKeys).toEqual(['create-key-0001', 'create-key-0001']);
    expect(api.created[0]).not.toHaveProperty('idempotencyKey');
    expect(textOf(retry)).toMatch(
      /^Already done: an earlier create_deck call with this idempotencyKey/,
    );
    expect(retry.structuredContent).toEqual(first.structuredContent);
    await expect(api.listDecks(testCaller())).resolves.toHaveLength(1);
  });

  it('rejects markup in the title before calling the API', async () => {
    const api = new FakeDecksApi();

    const result = await (
      await connect(createDecksService(api).decks)
    ).callTool({
      name: 'create_deck',
      arguments: { title: '<script>alert(1)</script>' },
    });

    expect(result.isError).toBe(true);
    expect(api.created).toEqual([]);
  });

  it('refuses without decks:write, even with decks:read', async () => {
    const api = new FakeDecksApi();

    const result = await (
      await connect(createDecksService(api).decks, testCaller({ scopes: ['decks:read'] }))
    ).callTool({ name: 'create_deck', arguments: { title: 'Biology' } });

    expect(textOf(result)).toMatch(/^REJECTED: FORBIDDEN\. .*"decks:write"/);
    expect(api.created).toEqual([]);
  });

  it('relays the API’s field problems in the REJECTED result', async () => {
    const api = new FakeDecksApi().failWith(
      new DeckClubError('VALIDATION_FAILED', 'The request body is invalid.', [
        { path: 'title', message: 'Too long' },
      ]),
    );

    const result = await (
      await connect(createDecksService(api).decks)
    ).callTool({
      name: 'create_deck',
      arguments: { title: 'Biology' },
    });

    expect(textOf(result)).toBe(
      'REJECTED: VALIDATION_FAILED. The request body is invalid. Fix: title: Too long.',
    );
  });
});

describe('DecksMcpFeature add_cards', () => {
  const CARD = { front: 'hablar', back: 'to speak' };
  const library = (): FakeDecksApi =>
    new FakeDecksApi().withDecks('token-ana', [
      testDeck({ id: DECK_ID, title: 'Spanish verbs', language: 'es' }),
    ]);

  it('declares its output and links the cards added view', async () => {
    const { tools } = await (await connect()).listTools();
    const addCards = tools.find((tool) => tool.name === 'add_cards');

    expect(Object.keys((addCards?.outputSchema as { properties: object }).properties)).toEqual([
      'deck',
      'cards',
      'firstCardNumber',
      'nextCursor',
      'addedCount',
    ]);
    expect(addCards?._meta?.ui).toMatchObject({ resourceUri: WIDGET_URIS.cardsAdded });
    expect(addCards?.annotations).toMatchObject({ readOnlyHint: false, destructiveHint: false });
  });

  it('tells the AI to check for duplicates first and to retry only with the same key', async () => {
    const { tools } = await (await connect()).listTools();
    const description = tools.find((tool) => tool.name === 'add_cards')?.description ?? '';

    expect(description).toContain('search_cards');
    expect(description).toContain('all or nothing');
    expect(description).toMatch(
      /Send a new idempotencyKey .* call again with the same cards and key/,
    );
    expect(description).not.toContain('not enforced');
  });

  it('publishes the optional idempotencyKey of add_cards and create_deck', async () => {
    const { tools } = await (await connect()).listTools();

    for (const name of ['add_cards', 'create_deck']) {
      const schema = tools.find((tool) => tool.name === name)?.inputSchema as {
        properties: Record<string, { description?: string }>;
        required?: string[];
      };
      expect(schema.properties.idempotencyKey?.description).toContain(
        'Reuse it only when retrying',
      );
      expect(schema.required ?? []).not.toContain('idempotencyKey');
    }
  });

  it('adds the cards once when the AI retries with the same key, and says so', async () => {
    const api = library();
    const connected = await connect(createDecksService(api).decks);
    const call = {
      name: 'add_cards',
      arguments: { deckId: DECK_ID, cards: [CARD], idempotencyKey: 'batch-key-0001' },
    };

    const first = await connected.callTool(call);
    const retry = await connected.callTool(call);

    expect(api.idempotencyKeys).toEqual(['batch-key-0001', 'batch-key-0001']);
    expect(textOf(first)).toMatch(/^Added 1 card/);
    expect(textOf(retry)).toMatch(
      /^Already done: an earlier add_cards call with this idempotencyKey/,
    );
    expect(retry.structuredContent).toEqual(first.structuredContent);
    await expect(api.listCards(testCaller(), DECK_ID)).resolves.toHaveLength(1);
  });

  it('relays a key reused for other cards as a REJECTED result the AI can act on', async () => {
    const connected = await connect(createDecksService(library()).decks);
    await connected.callTool({
      name: 'add_cards',
      arguments: { deckId: DECK_ID, cards: [CARD], idempotencyKey: 'batch-key-0001' },
    });

    const result = await connected.callTool({
      name: 'add_cards',
      arguments: {
        deckId: DECK_ID,
        cards: [{ front: 'comer', back: 'to eat' }],
        idempotencyKey: 'batch-key-0001',
      },
    });

    expect(textOf(result)).toMatch(
      /^REJECTED: IDEMPOTENCY_KEY_REUSED\. This idempotencyKey was already used/,
    );
  });

  it('rejects a malformed idempotencyKey before anything reaches the API', async () => {
    const api = library();

    const result = await (
      await connect(createDecksService(api).decks)
    ).callTool({
      name: 'add_cards',
      arguments: { deckId: DECK_ID, cards: [CARD], idempotencyKey: 'short' },
    });

    expect(result.isError).toBe(true);
    expect(api.batches).toEqual([]);
  });

  it('adds the cards with the schema’s defaults and answers with them, for the AI and the view', async () => {
    const api = library();

    const result = await (
      await connect(createDecksService(api).decks)
    ).callTool({ name: 'add_cards', arguments: { deckId: DECK_ID, cards: [CARD] } });

    expect(result.isError).toBeFalsy();
    expect(api.batches).toEqual([
      {
        deckId: DECK_ID,
        input: { cards: [{ type: 'basic', ...CARD, extra: '', tags: [] }] },
      },
    ]);
    expect(textOf(result)).toMatch(/^Added 1 card to the deck "Spanish verbs"/);
    expect(result.structuredContent).toMatchObject({
      deck: { id: DECK_ID, cardCount: 1 },
      cards: [{ front: 'hablar', addedBy: 'Claude' }],
      firstCardNumber: 1,
      addedCount: 1,
    });
  });

  it('rejects a card with markup before anything reaches the API', async () => {
    const api = library();

    const result = await (
      await connect(createDecksService(api).decks)
    ).callTool({
      name: 'add_cards',
      arguments: { deckId: DECK_ID, cards: [CARD, { front: '<b>hola</b>', back: 'hello' }] },
    });

    expect(result.isError).toBe(true);
    expect(api.batches).toEqual([]);
  });

  it('rejects more than 100 cards in one call', async () => {
    const api = library();
    const cards = Array.from({ length: 101 }, () => CARD);

    const result = await (
      await connect(createDecksService(api).decks)
    ).callTool({ name: 'add_cards', arguments: { deckId: DECK_ID, cards } });

    expect(result.isError).toBe(true);
    expect(api.batches).toEqual([]);
  });

  it('refuses without decks:write, even with decks:read', async () => {
    const api = library();

    const result = await (
      await connect(createDecksService(api).decks, testCaller({ scopes: ['decks:read'] }))
    ).callTool({ name: 'add_cards', arguments: { deckId: DECK_ID, cards: [CARD] } });

    expect(textOf(result)).toMatch(/^REJECTED: FORBIDDEN\. .*"decks:write"/);
    expect(api.batches).toEqual([]);
  });

  it('relays a deck that is not the caller’s as a REJECTED tool result', async () => {
    const result = await (
      await connect(createDecksService(library()).decks, testCaller({ accessToken: 'token-ben' }))
    ).callTool({ name: 'add_cards', arguments: { deckId: DECK_ID, cards: [CARD] } });

    expect(textOf(result)).toBe(
      'REJECTED: DECK_NOT_FOUND. No deck with that id exists in your library.',
    );
  });

  it('relays the card the API refused, so the AI can fix it', async () => {
    const api = library().failWritesWith(
      new DeckClubError('VALIDATION_FAILED', 'The request body is invalid.', [
        { path: 'cards.0.back', message: 'Too long' },
      ]),
    );

    const result = await (
      await connect(createDecksService(api).decks)
    ).callTool({ name: 'add_cards', arguments: { deckId: DECK_ID, cards: [CARD] } });

    expect(textOf(result)).toBe(
      'REJECTED: VALIDATION_FAILED. The request body is invalid. Fix: cards.0.back: Too long.',
    );
  });
});

describe('DecksMcpFeature update_card', () => {
  const CARD_ID = '00000000-0000-4000-8000-000000000009';
  const library = (): FakeDecksApi =>
    new FakeDecksApi()
      .withDecks('token-ana', [testDeck({ id: DECK_ID, title: 'Spanish verbs', cardCount: 1 })])
      .withCards(DECK_ID, [
        testCard({ id: CARD_ID, deckId: DECK_ID, front: 'hablar', back: 'to speak' }),
      ]);

  it('declares its output and links the card updated view', async () => {
    const { tools } = await (await connect()).listTools();
    const update = tools.find((tool) => tool.name === 'update_card');

    expect(Object.keys((update?.outputSchema as { properties: object }).properties)).toEqual([
      'deck',
      'card',
      'previous',
      'changedFields',
    ]);
    expect(update?._meta?.ui).toMatchObject({ resourceUri: WIDGET_URIS.cardUpdated });
    expect(update?.annotations).toMatchObject({ destructiveHint: true, idempotentHint: true });
  });

  it('tells the AI where ids come from, that tags replace, and that progress is kept', async () => {
    const { tools } = await (await connect()).listTools();
    const description = tools.find((tool) => tool.name === 'update_card')?.description ?? '';

    expect(description).toContain('get_deck, search_cards or add_cards');
    expect(description).toContain('replace all of the card’s tags');
    expect(description).toContain('keeps their study progress');
  });

  it('changes only the fields it was given and answers with before and after', async () => {
    const api = library();

    const result = await (
      await connect(createDecksService(api).decks)
    ).callTool({
      name: 'update_card',
      arguments: { deckId: DECK_ID, cardId: CARD_ID, back: '  to talk  ', tags: ['Verbs'] },
    });

    expect(result.isError).toBeFalsy();
    expect(api.updates).toEqual([
      { deckId: DECK_ID, cardId: CARD_ID, patch: { back: 'to talk', tags: ['verbs'] } },
    ]);
    expect(textOf(result)).toContain('- back: "to speak" → "to talk"');
    expect(result.structuredContent).toMatchObject({
      card: { back: 'to talk', tags: ['verbs'] },
      previous: { back: 'to speak', tags: [] },
      changedFields: ['back', 'tags'],
    });
  });

  it('rejects a call that changes nothing before anything reaches the API', async () => {
    const api = library();

    const result = await (
      await connect(createDecksService(api).decks)
    ).callTool({ name: 'update_card', arguments: { deckId: DECK_ID, cardId: CARD_ID } });

    expect(result.isError).toBe(true);
    expect(api.callers).toEqual([]);
  });

  it('rejects markup before anything reaches the API', async () => {
    const api = library();

    const result = await (
      await connect(createDecksService(api).decks)
    ).callTool({
      name: 'update_card',
      arguments: { deckId: DECK_ID, cardId: CARD_ID, front: '<script>x</script>' },
    });

    expect(result.isError).toBe(true);
    expect(api.updates).toEqual([]);
  });

  it('refuses without decks:write, even with decks:read', async () => {
    const api = library();

    const result = await (
      await connect(createDecksService(api).decks, testCaller({ scopes: ['decks:read'] }))
    ).callTool({
      name: 'update_card',
      arguments: { deckId: DECK_ID, cardId: CARD_ID, back: 'to talk' },
    });

    expect(textOf(result)).toMatch(/^REJECTED: FORBIDDEN\. .*"decks:write"/);
    expect(api.updates).toEqual([]);
  });

  it('relays a card that is not in the deck as a REJECTED result the AI can act on', async () => {
    const result = await (
      await connect(createDecksService(library()).decks)
    ).callTool({
      name: 'update_card',
      arguments: { deckId: DECK_ID, cardId: DECK_ID, back: 'to talk' },
    });

    expect(textOf(result)).toBe(
      'REJECTED: CARD_NOT_FOUND. No card with that id exists in this deck. Find the card’s id with get_deck or search_cards.',
    );
  });
});

describe('DecksMcpFeature delete_cards', () => {
  const CARD_ID = '00000000-0000-4000-8000-000000000009';
  const library = (): FakeDecksApi =>
    new FakeDecksApi()
      .withDecks('token-ana', [testDeck({ id: DECK_ID, title: 'Spanish verbs', cardCount: 1 })])
      .withCards(DECK_ID, [
        testCard({ id: CARD_ID, deckId: DECK_ID, front: 'hablar', back: 'to speak' }),
      ]);

  it('declares its output and links the cards deleted view', async () => {
    const { tools } = await (await connect()).listTools();
    const remove = tools.find((tool) => tool.name === 'delete_cards');

    expect(Object.keys((remove?.outputSchema as { properties: object }).properties)).toEqual([
      'deck',
      'deleted',
      'notFound',
      'notDeleted',
    ]);
    expect(remove?._meta?.ui).toMatchObject({ resourceUri: WIDGET_URIS.cardsDeleted });
    expect(remove?.annotations).toMatchObject({ destructiveHint: true, idempotentHint: true });
  });

  it('tells the AI to confirm first, and never promises a restore that does not exist', async () => {
    const { tools } = await (await connect()).listTools();
    const description = tools.find((tool) => tool.name === 'delete_cards')?.description ?? '';

    expect(description).toContain('Always ask the user to confirm first');
    expect(description).toContain('cannot be restored yet');
    expect(description).not.toMatch(/can be restored|30 days/);
  });

  it('deletes the cards and answers with them as they were, for the AI and the view', async () => {
    const api = library();

    const result = await (
      await connect(createDecksService(api).decks)
    ).callTool({ name: 'delete_cards', arguments: { deckId: DECK_ID, cardIds: [CARD_ID] } });

    expect(result.isError).toBeFalsy();
    expect(api.deletions).toEqual([{ deckId: DECK_ID, cardId: CARD_ID }]);
    expect(textOf(result)).toContain(`- ${CARD_ID}: [basic] front: hablar | back: to speak`);
    expect(result.structuredContent).toMatchObject({
      deck: { id: DECK_ID, cardCount: 0 },
      deleted: [{ id: CARD_ID, front: 'hablar' }],
      notFound: [],
      notDeleted: [],
    });
  });

  it('rejects an empty list or more than 100 ids before anything reaches the API', async () => {
    const api = library();
    const connected = await connect(createDecksService(api).decks);
    const many = Array.from({ length: 101 }, () => CARD_ID);

    const empty = await connected.callTool({
      name: 'delete_cards',
      arguments: { deckId: DECK_ID, cardIds: [] },
    });
    const tooMany = await connected.callTool({
      name: 'delete_cards',
      arguments: { deckId: DECK_ID, cardIds: many },
    });

    expect([empty.isError, tooMany.isError]).toEqual([true, true]);
    expect(api.callers).toEqual([]);
  });

  it('refuses without decks:write, even with decks:read', async () => {
    const api = library();

    const result = await (
      await connect(createDecksService(api).decks, testCaller({ scopes: ['decks:read'] }))
    ).callTool({ name: 'delete_cards', arguments: { deckId: DECK_ID, cardIds: [CARD_ID] } });

    expect(textOf(result)).toMatch(/^REJECTED: FORBIDDEN\. .*"decks:write"/);
    expect(api.deletions).toEqual([]);
  });

  it('relays another user’s deck as a REJECTED result, deleting nothing', async () => {
    const api = library();

    const result = await (
      await connect(createDecksService(api).decks, testCaller({ accessToken: 'token-ben' }))
    ).callTool({ name: 'delete_cards', arguments: { deckId: DECK_ID, cardIds: [CARD_ID] } });

    expect(textOf(result)).toBe(
      'REJECTED: DECK_NOT_FOUND. No deck with that id exists in your library.',
    );
    expect(api.deletions).toEqual([]);
  });
});

describe('DecksMcpFeature resources and prompt', () => {
  it('publishes the deck template and the card-writing guide', async () => {
    const connected = await connect();

    const { resources } = await connected.listResources();
    const { resourceTemplates } = await connected.listResourceTemplates();

    expect(resources.map((resource) => resource.uri)).toEqual(['deck-club://guides/card-writing']);
    expect(resourceTemplates.map((template) => template.uriTemplate)).toEqual([
      'deck-club://decks/{deckId}',
    ]);
  });

  it('reads a deck through the use case with the id from the URI', async () => {
    const service = newService();
    const readDeck = vi
      .spyOn(service, 'readDeck')
      .mockResolvedValue({ text: '# Spanish', mimeType: 'text/markdown' });

    const result = await (
      await connect(service)
    ).readResource({ uri: `deck-club://decks/${DECK_ID}` });

    expect(result.contents).toEqual([
      { uri: `deck-club://decks/${DECK_ID}`, mimeType: 'text/markdown', text: '# Spanish' },
    ]);
    expect(readDeck).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-ana' }), DECK_ID);
  });

  it('refuses to read a resource that is not built yet, naming the code', async () => {
    await expect(
      (await connect()).readResource({ uri: 'deck-club://guides/card-writing' }),
    ).rejects.toThrow(/REJECTED: NOT_IMPLEMENTED/);
  });

  it('publishes "Make cards from this" with a required source argument', async () => {
    const { prompts } = await (await connect()).listPrompts();

    expect(prompts).toHaveLength(1);
    expect(prompts[0]).toMatchObject({ name: 'make_cards', title: 'Make cards from this' });
    expect(prompts[0]?.arguments).toContainEqual(
      expect.objectContaining({ name: 'source', required: true }),
    );
  });

  it('builds the prompt messages through the use case', async () => {
    const service = newService();
    vi.spyOn(service, 'makeCardsPrompt').mockResolvedValue([
      { role: 'user', text: 'Make 20 cards.' },
    ]);

    const result = await (
      await connect(service)
    ).getPrompt({ name: 'make_cards', arguments: { source: 'notes' } });

    expect(result.messages).toEqual([
      { role: 'user', content: { type: 'text', text: 'Make 20 cards.' } },
    ]);
  });

  it('refuses the prompt while it is not built yet', async () => {
    await expect(
      (await connect()).getPrompt({ name: 'make_cards', arguments: { source: 'notes' } }),
    ).rejects.toThrow(/REJECTED: NOT_IMPLEMENTED/);
  });
});
