import 'reflect-metadata';
import { MCP_TOOL_NAMES } from '@deck-club/contracts';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { ENV, loadEnv } from '../src/config/env.js';
import { DECK_CLUB_API } from '../src/modules/deck-tools/application/ports/deck-club-api.js';
import { FakeDeckClubApi } from '../src/modules/deck-tools/testing/fake-deck-club-api.js';

let app: NestFastifyApplication;
let endpoint: URL;
const api = new FakeDeckClubApi();

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(ENV)
    .useValue(loadEnv({ WEB_PUBLIC_URL: 'https://deck.club', GIT_SHA: 'test' }))
    .overrideProvider(DECK_CLUB_API)
    .useValue(api)
    .compile();
  app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter(), {
    logger: false,
  });
  await app.listen({ port: 0, host: '127.0.0.1' });
  endpoint = new URL('/mcp', await app.getUrl());
});

afterAll(async () => {
  await app.close();
});

async function connect(accessToken: string): Promise<Client> {
  const client = new Client({ name: 'claude-code', version: '1.0.0' });
  await client.connect(
    new StreamableHTTPClientTransport(endpoint, {
      requestInit: { headers: { authorization: `Bearer ${accessToken}` } },
    }),
  );
  return client;
}

function textOf(result: Awaited<ReturnType<Client['callTool']>>): string {
  const [first] = result.content as { type: string; text: string }[];
  return first?.text ?? '';
}

describe('MCP contract over Streamable HTTP', () => {
  it('refuses a request without a bearer token with 401', async () => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    });

    expect(response.status).toBe(401);
  });

  it('lists every tool in MCP_TOOL_NAMES with a description and input schema', async () => {
    const client = await connect('token-ana');

    const { tools } = await client.listTools();

    expect(tools.map((tool) => tool.name).sort()).toEqual([...MCP_TOOL_NAMES].sort());
    for (const tool of tools) {
      expect(tool.description?.length).toBeGreaterThan(20);
      expect(tool.inputSchema.type).toBe('object');
    }
    await client.close();
  });

  it('creates a deck and adds cards, recording the AI client', async () => {
    const client = await connect('token-ana');

    const created = await client.callTool({
      name: 'create_deck',
      arguments: { title: 'Spanish', language: 'es' },
    });
    const deckId = /id: ([0-9a-f-]{36})/.exec(textOf(created))?.[1];
    const added = await client.callTool({
      name: 'add_cards',
      arguments: { deckId, cards: [{ front: 'hablar', back: 'to speak' }] },
    });

    expect(textOf(added)).toContain('Added 1 card');
    expect(api.calls.at(-1)?.caller.clientName).toBe('Claude');
    await client.close();
  });

  it('returns invalid arguments as a tool error, not a protocol error', async () => {
    const client = await connect('token-ana');

    const result = await client.callTool({
      name: 'add_cards',
      arguments: { deckId: 'not-a-uuid', cards: [] },
    });

    expect(result.isError).toBe(true);
    await client.close();
  });

  it('returns a refusal from the API as a REJECTED tool result', async () => {
    const client = await connect('token-ben');

    const result = await client.callTool({
      name: 'get_deck',
      arguments: { deckId: '00000000-0000-4000-8000-999999999999' },
    });

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain('REJECTED: DECK_NOT_FOUND');
    await client.close();
  });
});
