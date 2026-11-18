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
      ['add_cards', WIDGET_URIS.deck],
      ['create_deck', WIDGET_URIS.deckCreated],
      ['get_deck', WIDGET_URIS.deck],
      ['list_decks', WIDGET_URIS.deckLibrary],
      ['search_cards', WIDGET_URIS.searchResults],
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

  it('tells the AI a tool is not built yet, as a REJECTED tool result', async () => {
    const result = await (
      await connect()
    ).callTool({ name: 'delete_cards', arguments: { deckId: DECK_ID, cardIds: [DECK_ID] } });

    expect(result.isError).toBe(true);
    expect(textOf(result)).toMatch(
      /^REJECTED: NOT_IMPLEMENTED\. delete_cards is not available yet/,
    );
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
    const addCards = vi.spyOn(service, 'addCards').mockResolvedValue({
      text: 'Added 1 card.',
      structuredContent: { created: 1 },
    });

    const result = await (
      await connect(service)
    ).callTool({
      name: 'add_cards',
      arguments: { deckId: DECK_ID, cards: [{ front: 'hola', back: 'hello' }] },
    });

    expect(result).toMatchObject({
      content: [{ type: 'text', text: 'Added 1 card.' }],
      structuredContent: { created: 1 },
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
