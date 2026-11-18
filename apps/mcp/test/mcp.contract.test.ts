import { MCP_PROMPT_NAMES, MCP_TOOL_NAMES } from '@deck-club/contracts';
import type { Client } from '@modelcontextprotocol/client';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { textOf } from '../src/common/mcp/testing/mcp-test-client.js';
import { WIDGET_URIS } from '../src/common/mcp/widgets.js';
import { DecksService } from '../src/modules/decks/application/decks.service.js';
import {
  API_CARDS,
  API_DECK,
  connectClient,
  postJsonRpc,
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
