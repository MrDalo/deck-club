import {
  DeleteCardsOutputSchema,
  MCP_PROMPT_NAMES,
  MCP_TOOL_NAMES,
  UpdateCardOutputSchema,
} from '@deck-club/contracts';
import type { Client } from '@modelcontextprotocol/client';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { textOf } from '../src/common/mcp/testing/mcp-test-client.js';
import { WIDGET_URIS } from '../src/common/mcp/widgets.js';
import { DecksService } from '../src/modules/decks/application/decks.service.js';
import { undoArguments } from '../src/modules/widgets/views/card-updated-markup.js';
import { addBackArguments } from '../src/modules/widgets/views/cards-deleted-markup.js';
import {
  API_CARDS,
  API_DECK,
  connectClient,
  postJsonRpc,
  resetWrites,
  startTestServer,
  type TestServer,
  TOKENS,
} from './test-app.js';

let server: TestServer;
let decks: DecksService;
let client: Client | undefined;

beforeAll(async () => {
  server = await startTestServer();
  decks = server.app.get(DecksService);
});

afterEach(async () => {
  vi.restoreAllMocks();
  resetWrites(server);
  await client?.close();
  client = undefined;
});

afterAll(async () => {
  await server.app.close();
});

async function connect(era: 'modern' | 'legacy', name = 'claude-code'): Promise<Client> {
  client = await connectClient(server.endpoint, { token: TOKENS.ana, name, era });
  return client;
}

describe.each(['modern', 'legacy'] as const)('MCP over Streamable HTTP, %s era', (era) => {
  it('negotiates the expected protocol revision', async () => {
    const connected = await connect(era);

    expect(connected.getServerVersion()).toMatchObject({ name: 'deck-club', title: 'Deck Club' });
    expect(connected.getInstructions()).toContain('REJECTED');
  });

  it('lists every tool of MCP_TOOL_NAMES, described for the AI', async () => {
    const { tools } = await (await connect(era)).listTools();

    expect(tools.map((tool) => tool.name).sort()).toEqual([...MCP_TOOL_NAMES].sort());
    for (const tool of tools) expect(tool.description?.length).toBeGreaterThan(40);
  });

  it('lists every prompt of MCP_PROMPT_NAMES', async () => {
    const { prompts } = await (await connect(era)).listPrompts();

    expect(prompts.map((prompt) => prompt.name).sort()).toEqual([...MCP_PROMPT_NAMES].sort());
  });

  it('lists the context resources, the deck template and every MCP Apps view', async () => {
    const connected = await connect(era);

    const { resources } = await connected.listResources();
    const { resourceTemplates } = await connected.listResourceTemplates();

    expect(resources.map((resource) => resource.uri).sort()).toEqual(
      [
        'deck-club://guides/card-writing',
        'deck-club://study/today',
        ...Object.values(WIDGET_URIS),
      ].sort(),
    );
    expect(resourceTemplates.map((template) => template.uriTemplate)).toEqual([
      'deck-club://decks/{deckId}',
    ]);
  });

  it('lists the user’s decks, for the model and for the view', async () => {
    const result = await (await connect(era)).callTool({ name: 'list_decks', arguments: {} });

    expect(result.isError).toBeFalsy();
    expect(textOf(result)).toContain(
      `"Spanish verbs" (id: ${API_DECK.id}, language: es, 30 cards)`,
    );
    expect(result.structuredContent).toEqual({
      decks: [
        {
          id: API_DECK.id,
          title: 'Spanish verbs',
          description: '',
          language: 'es',
          cardCount: 30,
          url: `https://deck.club/decks/${API_DECK.id}`,
        },
      ],
      deckCount: 1,
      libraryUrl: 'https://deck.club/decks',
    });
  });

  it('serves the deck library view the list_decks tool links to', async () => {
    const connected = await connect(era);
    const listDecks = (await connected.listTools()).tools.find(
      (tool) => tool.name === 'list_decks',
    );

    const view = await connected.readResource({
      uri: (listDecks?._meta?.ui as { resourceUri: string }).resourceUri,
    });

    expect(view.contents[0]).toMatchObject({
      uri: 'ui://deck-club/deck-library.html',
      mimeType: 'text/html;profile=mcp-app',
    });
    expect((view.contents[0] as { text: string }).text).toContain('Your decks');
  });

  it('reads a deck page by page, following the cursor it hands out', async () => {
    const connected = await connect(era);

    const first = await connected.callTool({
      name: 'get_deck',
      arguments: { deckId: API_DECK.id },
    });
    const { nextCursor } = first.structuredContent as { nextCursor: string };
    const second = await connected.callTool({
      name: 'get_deck',
      arguments: { deckId: API_DECK.id, cursor: nextCursor },
    });

    expect(textOf(first)).toContain('Cards 1–25 of 30:');
    expect(textOf(first)).toContain('1. [basic] front: front 1 | back: back 1 | added by Claude');
    expect(first.structuredContent).toMatchObject({
      deck: { id: API_DECK.id, title: 'Spanish verbs' },
      firstCardNumber: 1,
    });
    expect(second.structuredContent).toMatchObject({ firstCardNumber: 26, nextCursor: null });
    expect((second.structuredContent as { cards: unknown[] }).cards).toHaveLength(
      API_CARDS.length - 25,
    );
  });

  it('serves the deck view the get_deck tool links to', async () => {
    const connected = await connect(era);
    const getDeck = (await connected.listTools()).tools.find((tool) => tool.name === 'get_deck');

    const view = await connected.readResource({
      uri: (getDeck?._meta?.ui as { resourceUri: string }).resourceUri,
    });

    expect(view.contents[0]).toMatchObject({
      uri: 'ui://deck-club/deck.html',
      mimeType: 'text/html;profile=mcp-app',
    });
    expect((view.contents[0] as { text: string }).text).toContain('Show more cards');
  });

  it('searches the user’s cards through the API, for the model and for the view', async () => {
    const result = await (
      await connect(era)
    ).callTool({
      name: 'search_cards',
      arguments: { query: 'front 1' },
    });

    expect(textOf(result)).toContain('1 card matches "front 1" across all decks:');
    expect(result.structuredContent).toMatchObject({
      query: 'front 1',
      deckId: null,
      matches: [
        { card: { front: 'front 1', addedBy: 'Claude' }, deck: { title: 'Spanish verbs' } },
      ],
      totalMatches: 1,
    });
    const search = server.api.requests.findLast((url) => url.pathname === '/cards/search');
    expect(Object.fromEntries(search?.searchParams ?? [])).toEqual({ q: 'front 1', limit: '20' });
  });

  it('serves the search results view the search_cards tool links to', async () => {
    const connected = await connect(era);
    const search = (await connected.listTools()).tools.find((tool) => tool.name === 'search_cards');

    const view = await connected.readResource({
      uri: (search?._meta?.ui as { resourceUri: string }).resourceUri,
    });

    expect(view.contents[0]).toMatchObject({
      uri: 'ui://deck-club/search-results.html',
      mimeType: 'text/html;profile=mcp-app',
    });
    expect((view.contents[0] as { text: string }).text).toContain('Search your cards');
  });

  it('creates a deck through the API, for the model and for the view', async () => {
    const result = await (
      await connect(era)
    ).callTool({
      name: 'create_deck',
      arguments: { title: 'Biology', language: 'en', tags: ['Cells'] },
    });

    expect(textOf(result)).toMatch(
      /^Created the private deck "Biology" \(id: 00000000-0000-4000-8000-0000000000c1/,
    );
    expect(result.structuredContent).toMatchObject({
      deck: { title: 'Biology', tags: ['cells'], visibility: 'private', cardCount: 0 },
      libraryUrl: 'https://deck.club/decks',
    });
    expect(server.api.bodies.at(-1)).toEqual({
      title: 'Biology',
      description: '',
      language: 'en',
      tags: ['cells'],
    });
  });

  it('serves the deck created view the create_deck tool links to', async () => {
    const connected = await connect(era);
    const create = (await connected.listTools()).tools.find((tool) => tool.name === 'create_deck');

    const view = await connected.readResource({
      uri: (create?._meta?.ui as { resourceUri: string }).resourceUri,
    });

    expect(view.contents[0]).toMatchObject({
      uri: 'ui://deck-club/deck-created.html',
      mimeType: 'text/html;profile=mcp-app',
    });
    expect((view.contents[0] as { text: string }).text).toContain('Next: fill it with cards');
  });

  it('adds cards through the API, stamped with the AI client, for the model and for the view', async () => {
    const result = await (
      await connect(era, 'claude-ai')
    ).callTool({
      name: 'add_cards',
      arguments: {
        deckId: API_DECK.id,
        cards: [
          { front: 'comer', back: 'to eat' },
          { type: 'reversible', front: 'vivir', back: 'to live', tags: ['Verbs'] },
        ],
      },
    });

    expect(result.isError).toBeFalsy();
    expect(textOf(result)).toMatch(
      new RegExp(
        `^Added 2 cards to the deck "Spanish verbs" \\(id: ${API_DECK.id}\\); it now has 32 cards\\.`,
      ),
    );
    expect(result.structuredContent).toMatchObject({
      deck: { id: API_DECK.id, cardCount: 32 },
      cards: [
        { front: 'comer', type: 'basic', addedBy: 'Claude' },
        { front: 'vivir', type: 'reversible', tags: ['verbs'], addedBy: 'Claude' },
      ],
      firstCardNumber: 31,
      nextCursor: null,
      addedCount: 2,
    });
    const batch = server.api.requests.findLast((url) => url.pathname.endsWith('/cards/batch'));
    expect(batch?.pathname).toBe(`/decks/${API_DECK.id}/cards/batch`);
    expect(server.api.bodies.at(-1)).toEqual({
      cards: [
        { type: 'basic', front: 'comer', back: 'to eat', extra: '', tags: [] },
        { type: 'reversible', front: 'vivir', back: 'to live', extra: '', tags: ['verbs'] },
      ],
    });
  });

  it('serves the cards added view the add_cards tool links to', async () => {
    const connected = await connect(era);
    const addCards = (await connected.listTools()).tools.find((tool) => tool.name === 'add_cards');

    const view = await connected.readResource({
      uri: (addCards?._meta?.ui as { resourceUri: string }).resourceUri,
    });

    expect(view.contents[0]).toMatchObject({
      uri: 'ui://deck-club/cards-added.html',
      mimeType: 'text/html;profile=mcp-app',
    });
    expect((view.contents[0] as { text: string }).text).toContain('Next: learn them');
  });

  it('edits a card through the API, for the model and for the view', async () => {
    const [card] = API_CARDS;

    const result = await (
      await connect(era)
    ).callTool({
      name: 'update_card',
      arguments: { deckId: API_DECK.id, cardId: card!.id, back: 'to speak', tags: ['Verbs'] },
    });

    expect(result.isError).toBeFalsy();
    expect(textOf(result).split('\n').slice(0, 3)).toEqual([
      `Updated the card ${card!.id} in the deck "Spanish verbs" (id: ${API_DECK.id}). The user's study progress on it is kept.`,
      '- back: "back 1" → "to speak"',
      '- tags: (no tags) → verbs',
    ]);
    expect(result.structuredContent).toMatchObject({
      deck: { id: API_DECK.id, title: 'Spanish verbs' },
      card: {
        id: card!.id,
        front: 'front 1',
        back: 'to speak',
        tags: ['verbs'],
        addedBy: 'Claude',
      },
      previous: { back: 'back 1', tags: [] },
      changedFields: ['back', 'tags'],
    });
    const patch = server.api.requests.at(-1);
    expect(patch?.pathname).toBe(`/decks/${API_DECK.id}/cards/${card!.id}`);
    expect(server.api.bodies.at(-1)).toEqual({ back: 'to speak', tags: ['verbs'] });
  });

  it('serves the card updated view the update_card tool links to', async () => {
    const connected = await connect(era);
    const update = (await connected.listTools()).tools.find((tool) => tool.name === 'update_card');

    const view = await connected.readResource({
      uri: (update?._meta?.ui as { resourceUri: string }).resourceUri,
    });

    expect(view.contents[0]).toMatchObject({
      uri: 'ui://deck-club/card-updated.html',
      mimeType: 'text/html;profile=mcp-app',
    });
    expect((view.contents[0] as { text: string }).text).toContain('Undo this change');
  });

  it('deletes cards through the API, for the model and for the view', async () => {
    const [first, second] = API_CARDS;

    const result = await (
      await connect(era)
    ).callTool({
      name: 'delete_cards',
      arguments: { deckId: API_DECK.id, cardIds: [first!.id, second!.id] },
    });

    expect(result.isError).toBeFalsy();
    expect(textOf(result)).toMatch(
      new RegExp(
        `^Deleted 2 cards from the deck "Spanish verbs" \\(id: ${API_DECK.id}\\); it now has 28 cards\\.`,
      ),
    );
    expect(result.structuredContent).toMatchObject({
      deck: { id: API_DECK.id, cardCount: 28 },
      deleted: [
        { id: first!.id, front: 'front 1', addedBy: 'Claude' },
        { id: second!.id, front: 'front 2' },
      ],
      notFound: [],
      notDeleted: [],
    });
    const deletes = server.api.requests.slice(-2).map((url) => url.pathname);
    expect(deletes).toEqual([
      `/decks/${API_DECK.id}/cards/${first!.id}`,
      `/decks/${API_DECK.id}/cards/${second!.id}`,
    ]);
    expect([...server.api.deletedCards]).toEqual([first!.id, second!.id]);
  });

  it('serves the cards deleted view the delete_cards tool links to', async () => {
    const connected = await connect(era);
    const remove = (await connected.listTools()).tools.find((tool) => tool.name === 'delete_cards');

    const view = await connected.readResource({
      uri: (remove?._meta?.ui as { resourceUri: string }).resourceUri,
    });

    expect(view.contents[0]).toMatchObject({
      uri: 'ui://deck-club/cards-deleted.html',
      mimeType: 'text/html;profile=mcp-app',
    });
    expect((view.contents[0] as { text: string }).text).toContain('Add them back as new cards');
  });

  it('answers a tool that is not built yet with a REJECTED tool result', async () => {
    const result = await (await connect(era)).callTool({ name: 'get_stats', arguments: {} });

    expect(result.isError).toBe(true);
    expect(textOf(result)).toMatch(/^REJECTED: NOT_IMPLEMENTED\./);
  });

  it('returns invalid arguments as a tool error, not a protocol error', async () => {
    const result = await (
      await connect(era)
    ).callTool({ name: 'get_deck', arguments: { deckId: 'nope' } });

    expect(result.isError).toBe(true);
  });

  it('serves an MCP Apps view', async () => {
    const { contents } = await (await connect(era)).readResource({ uri: WIDGET_URIS.deck });

    expect(contents[0]).toMatchObject({ mimeType: 'text/html;profile=mcp-app' });
  });

  it('hands the use case the verified user and the AI client’s name', async () => {
    const listDecks = vi.spyOn(decks, 'listDecks').mockResolvedValue({
      text: 'No decks yet.',
      structuredContent: { decks: [], deckCount: 0, libraryUrl: 'https://deck.club/decks' },
    });

    const result = await (
      await connect(era, 'claude-ai')
    ).callTool({ name: 'list_decks', arguments: {} });

    expect(textOf(result)).toBe('No decks yet.');
    expect(listDecks).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: TOKENS.ana,
        userId: 'user-ana',
        clientId: 'claude-oauth-client',
        clientName: 'Claude',
      }),
      {},
    );
  });
});

describe('get_deck authorization', () => {
  it('relays the API’s DECK_NOT_FOUND for another user’s deck, without its content', async () => {
    const ben = await connectClient(server.endpoint, { token: TOKENS.ben, era: 'modern' });

    const result = await ben.callTool({ name: 'get_deck', arguments: { deckId: API_DECK.id } });

    expect(result.isError).toBe(true);
    expect(textOf(result)).toBe(
      'REJECTED: DECK_NOT_FOUND. No deck with that id exists in your library.',
    );
    expect(JSON.stringify(result)).not.toContain('front 1');
    await ben.close();
  });

  it('refuses a cursor from another deck as a tool result, not a protocol error', async () => {
    const connected = await connectClient(server.endpoint, { token: TOKENS.ana, era: 'modern' });

    const result = await connected.callTool({
      name: 'get_deck',
      arguments: { deckId: API_DECK.id, cursor: 'eyJkZWNrSWQiOiJ4Iiwib2Zmc2V0IjoyNX0' },
    });

    expect(textOf(result)).toMatch(/^REJECTED: VALIDATION_FAILED\./);
    await connected.close();
  });
});

describe('search_cards authorization', () => {
  it('finds none of another user’s cards', async () => {
    const ben = await connectClient(server.endpoint, { token: TOKENS.ben, era: 'modern' });

    const result = await ben.callTool({ name: 'search_cards', arguments: { query: 'front 1' } });

    expect(textOf(result)).toMatch(/^No cards match "front 1" across all decks\./);
    expect(JSON.stringify(result)).not.toContain('back 1');
    await ben.close();
  });

  it('relays DECK_NOT_FOUND when the deck filter names another user’s deck', async () => {
    const ben = await connectClient(server.endpoint, { token: TOKENS.ben, era: 'modern' });

    const result = await ben.callTool({
      name: 'search_cards',
      arguments: { query: 'front', deckId: API_DECK.id },
    });

    expect(textOf(result)).toBe(
      'REJECTED: DECK_NOT_FOUND. No deck with that id exists in your library.',
    );
    await ben.close();
  });
});

describe('create_deck authorization', () => {
  it('rejects an invalid deck before it reaches the API', async () => {
    const connected = await connectClient(server.endpoint, { token: TOKENS.ana, era: 'modern' });
    const before = server.api.bodies.length;

    const result = await connected.callTool({
      name: 'create_deck',
      arguments: { title: 'Biology', language: 'biology' },
    });

    expect(result.isError).toBe(true);
    expect(server.api.bodies).toHaveLength(before);
    await connected.close();
  });

  it('creates nothing without a valid token', async () => {
    const before = server.api.bodies.length;

    const response = await postJsonRpc(
      server.endpoint,
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: 'create_deck', arguments: { title: 'x' } },
      },
      { authorization: 'Bearer forged' },
    );

    expect(response.status).toBe(401);
    expect(server.api.bodies).toHaveLength(before);
  });
});

describe('idempotent writes over HTTP', () => {
  const BATCH = {
    deckId: API_DECK.id,
    cards: [{ front: 'comer', back: 'to eat' }],
    idempotencyKey: 'batch-key-0001',
  };

  it('sends add_cards’ idempotencyKey to the API, which adds a retried batch once', async () => {
    const connected = await connectClient(server.endpoint, { token: TOKENS.ana, era: 'modern' });

    const first = await connected.callTool({ name: 'add_cards', arguments: BATCH });
    const retry = await connected.callTool({ name: 'add_cards', arguments: BATCH });

    expect(server.api.idempotencyKeys).toEqual(['batch-key-0001', 'batch-key-0001']);
    expect(server.api.addedCards).toHaveLength(1);
    expect(textOf(first)).toMatch(/^Added 1 card to the deck "Spanish verbs"/);
    expect(textOf(retry)).toMatch(
      /^Already done: an earlier add_cards call with this idempotencyKey added these cards, so none were added twice\.\nAdded 1 card/,
    );
    expect(retry.structuredContent).toEqual(first.structuredContent);
    expect(server.api.bodies.at(-1)).not.toHaveProperty('idempotencyKey');
    await connected.close();
  });

  it('relays the API’s refusal of a key reused for other cards, in the tool’s words', async () => {
    const connected = await connectClient(server.endpoint, { token: TOKENS.ana, era: 'modern' });
    await connected.callTool({ name: 'add_cards', arguments: BATCH });

    const result = await connected.callTool({
      name: 'add_cards',
      arguments: { ...BATCH, cards: [{ front: 'vivir', back: 'to live' }] },
    });

    expect(textOf(result)).toBe(
      'REJECTED: IDEMPOTENCY_KEY_REUSED. This idempotencyKey was already used for a different call. Use a new key for a new add_cards call; reuse a key only to retry exactly the same call.',
    );
    expect(server.api.addedCards).toHaveLength(1);
    await connected.close();
  });

  it('sends no key when the AI gives none, so the API writes as before', async () => {
    const connected = await connectClient(server.endpoint, { token: TOKENS.ana, era: 'modern' });
    const { idempotencyKey: _none, ...withoutKey } = BATCH;

    await connected.callTool({ name: 'add_cards', arguments: withoutKey });
    await connected.callTool({ name: 'add_cards', arguments: withoutKey });

    expect(server.api.idempotencyKeys).toEqual([null, null]);
    expect(server.api.addedCards).toHaveLength(2);
    await connected.close();
  });

  it('sends create_deck’s idempotencyKey as a header, never in the deck', async () => {
    const connected = await connectClient(server.endpoint, { token: TOKENS.ana, era: 'modern' });
    const call = {
      name: 'create_deck',
      arguments: { title: 'Biology', idempotencyKey: 'create-key-0001' },
    };

    const first = await connected.callTool(call);
    const retry = await connected.callTool(call);

    expect(server.api.idempotencyKeys).toEqual(['create-key-0001', 'create-key-0001']);
    expect(server.api.bodies.at(-1)).toEqual({
      title: 'Biology',
      description: '',
      language: 'en',
      tags: [],
    });
    expect(textOf(retry)).toMatch(
      /^Already done: an earlier create_deck call with this idempotencyKey created this deck/,
    );
    expect(retry.structuredContent).toEqual(first.structuredContent);
    await connected.close();
  });
});

describe('update_card authorization', () => {
  const patchesSince = (before: number): URL[] =>
    server.api.requests.slice(before).filter((url) => /\/cards\/[0-9a-f-]{36}$/.test(url.pathname));

  it('refuses another user’s deck before anything is written', async () => {
    const ben = await connectClient(server.endpoint, { token: TOKENS.ben, era: 'modern' });
    const before = server.api.requests.length;

    const result = await ben.callTool({
      name: 'update_card',
      arguments: { deckId: API_DECK.id, cardId: API_CARDS[0]!.id, back: 'mine now' },
    });

    expect(textOf(result)).toBe(
      'REJECTED: DECK_NOT_FOUND. No deck with that id exists in your library.',
    );
    expect(patchesSince(before)).toEqual([]);
    expect(server.api.updatedCards.size).toBe(0);
    await ben.close();
  });

  it('refuses a card that is not in the deck before anything is written', async () => {
    const connected = await connectClient(server.endpoint, { token: TOKENS.ana, era: 'modern' });
    const before = server.api.requests.length;

    const result = await connected.callTool({
      name: 'update_card',
      arguments: { deckId: API_DECK.id, cardId: API_DECK.id, back: 'x' },
    });

    expect(textOf(result)).toMatch(/^REJECTED: CARD_NOT_FOUND\./);
    expect(patchesSince(before)).toEqual([]);
    await connected.close();
  });

  it('undoes an edit with the arguments its view sends, card as it was', async () => {
    const connected = await connectClient(server.endpoint, { token: TOKENS.ana, era: 'modern' });
    const cardId = API_CARDS[1]!.id;
    const edit = await connected.callTool({
      name: 'update_card',
      arguments: { deckId: API_DECK.id, cardId, front: 'changed', extra: 'note' },
    });

    const undo = await connected.callTool({
      name: 'update_card',
      arguments: undoArguments(UpdateCardOutputSchema.parse(edit.structuredContent)),
    });

    expect(undo.structuredContent).toMatchObject({
      card: { front: 'front 2', extra: '' },
      previous: { front: 'changed', extra: 'note' },
      changedFields: ['front', 'extra'],
    });
    await connected.close();
  });
});

describe('delete_cards over HTTP', () => {
  const deletesSince = (before: number): URL[] =>
    server.api.requests.slice(before).filter((url) => /\/cards\/[0-9a-f-]{36}$/.test(url.pathname));

  it('refuses another user’s deck before anything is deleted', async () => {
    const ben = await connectClient(server.endpoint, { token: TOKENS.ben, era: 'modern' });
    const before = server.api.requests.length;

    const result = await ben.callTool({
      name: 'delete_cards',
      arguments: { deckId: API_DECK.id, cardIds: [API_CARDS[0]!.id] },
    });

    expect(textOf(result)).toBe(
      'REJECTED: DECK_NOT_FOUND. No deck with that id exists in your library.',
    );
    expect(deletesSince(before)).toEqual([]);
    expect(server.api.deletedCards.size).toBe(0);
    await ben.close();
  });

  it('deletes nothing for an id that is not in the deck, and says so', async () => {
    const connected = await connectClient(server.endpoint, { token: TOKENS.ana, era: 'modern' });
    const before = server.api.requests.length;

    const result = await connected.callTool({
      name: 'delete_cards',
      arguments: { deckId: API_DECK.id, cardIds: [API_DECK.id] },
    });

    expect(textOf(result)).toMatch(/^No cards were deleted from the deck "Spanish verbs"/);
    expect(deletesSince(before)).toEqual([]);
    await connected.close();
  });

  it('adds deleted cards back, once, with the arguments its view sends', async () => {
    const connected = await connectClient(server.endpoint, { token: TOKENS.ana, era: 'modern' });
    const removed = await connected.callTool({
      name: 'delete_cards',
      arguments: { deckId: API_DECK.id, cardIds: [API_CARDS[2]!.id, API_CARDS[3]!.id] },
    });
    // As the view does: the arguments are built anew on every click.
    const click = (): ReturnType<Client['callTool']> =>
      connected.callTool({
        name: 'add_cards',
        arguments: addBackArguments(DeleteCardsOutputSchema.parse(removed.structuredContent)),
      });

    const first = await click();
    const secondClick = await click();

    expect(first.structuredContent).toMatchObject({
      addedCount: 2,
      cards: [{ front: 'front 3' }, { front: 'front 4' }],
    });
    expect(textOf(secondClick)).toMatch(/^Already done: an earlier add_cards call/);
    expect(server.api.addedCards.map((card) => card.front)).toEqual(['front 3', 'front 4']);
    await connected.close();
  });
});

describe('add_cards authorization', () => {
  it('refuses another user’s deck before anything is written', async () => {
    const ben = await connectClient(server.endpoint, { token: TOKENS.ben, era: 'modern' });
    const before = server.api.requests.length;

    const result = await ben.callTool({
      name: 'add_cards',
      arguments: { deckId: API_DECK.id, cards: [{ front: 'hola', back: 'hello' }] },
    });

    expect(textOf(result)).toBe(
      'REJECTED: DECK_NOT_FOUND. No deck with that id exists in your library.',
    );
    expect(
      server.api.requests.slice(before).some((url) => url.pathname.endsWith('/cards/batch')),
    ).toBe(false);
    expect(server.api.addedCards).toEqual([]);
    await ben.close();
  });

  it('rejects an invalid card before the batch reaches the API', async () => {
    const connected = await connectClient(server.endpoint, { token: TOKENS.ana, era: 'modern' });
    const before = server.api.bodies.length;

    const result = await connected.callTool({
      name: 'add_cards',
      arguments: { deckId: API_DECK.id, cards: [{ front: '<script>x</script>', back: 'y' }] },
    });

    expect(result.isError).toBe(true);
    expect(server.api.bodies).toHaveLength(before);
    await connected.close();
  });

  it('writes nothing and relays UPSTREAM_UNAVAILABLE when the API cannot be reached', async () => {
    const connected = await connectClient(server.endpoint, { token: TOKENS.ana, era: 'modern' });
    const before = server.api.requests.length;
    server.api.healthy = false;

    try {
      const result = await connected.callTool({
        name: 'add_cards',
        arguments: { deckId: API_DECK.id, cards: [{ front: 'hola', back: 'hello' }] },
      });

      expect(textOf(result)).toMatch(/^REJECTED: UPSTREAM_UNAVAILABLE\./);
      expect(
        server.api.requests.slice(before).some((url) => url.pathname.endsWith('/cards/batch')),
      ).toBe(false);
    } finally {
      server.api.healthy = true;
      await connected.close();
    }
  });
});

describe('MCP transport rules', () => {
  it('keeps users apart: each request is bound to its own token', async () => {
    const listDecks = vi.spyOn(decks, 'listDecks').mockResolvedValue({
      text: 'ok',
      structuredContent: { decks: [], deckCount: 0, libraryUrl: 'https://deck.club/decks' },
    });
    const ana = await connectClient(server.endpoint, { token: TOKENS.ana, era: 'modern' });
    const ben = await connectClient(server.endpoint, { token: TOKENS.ben, era: 'modern' });

    await Promise.all([
      ana.callTool({ name: 'list_decks', arguments: {} }),
      ben.callTool({ name: 'list_decks', arguments: {} }),
    ]);

    const users = listDecks.mock.calls.map(([caller]) => [caller.userId, caller.accessToken]);
    expect(users.sort()).toEqual([
      ['user-ana', TOKENS.ana],
      ['user-ben', TOKENS.ben],
    ]);
    await Promise.all([ana.close(), ben.close()]);
  });

  it('acknowledges a notification with 202 and no body', async () => {
    const response = await postJsonRpc(
      server.endpoint,
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      { authorization: `Bearer ${TOKENS.ana}` },
    );

    expect(response.status).toBe(202);
  });

  it('has no server stream and no sessions: GET and DELETE answer 405', async () => {
    const headers = { authorization: `Bearer ${TOKENS.ana}`, accept: 'text/event-stream' };

    const get = await fetch(server.endpoint, { method: 'GET', headers });
    const remove = await fetch(server.endpoint, { method: 'DELETE', headers });

    expect([get.status, remove.status]).toEqual([405, 405]);
  });

  it('refuses a browser request from a foreign origin (DNS rebinding)', async () => {
    const response = await postJsonRpc(
      server.endpoint,
      { jsonrpc: '2.0', id: 1, method: 'tools/list' },
      { authorization: `Bearer ${TOKENS.ana}`, origin: 'https://evil.example.com' },
    );

    expect(response.status).toBe(403);
  });

  it('accepts a browser request from the MCP server’s own public host', async () => {
    const response = await postJsonRpc(
      server.endpoint,
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      { authorization: `Bearer ${TOKENS.ana}`, origin: 'https://mcp.deck.club' },
    );

    expect(response.status).toBe(202);
  });
});
