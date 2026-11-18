import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport, type McpServer } from '@modelcontextprotocol/server';
import { describe, expect, it } from 'vitest';
import { type McpCaller, toAuthInfo } from '../../../common/mcp/mcp-caller.js';
import type { McpFeatureContributor } from '../../../common/mcp/mcp-feature.js';
import { McpServerFactory } from './mcp-server-factory.js';
import { SERVER_INFO } from './server-identity.js';

const CALLER: McpCaller = {
  accessToken: 'token-ana',
  userId: 'user-ana',
  clientId: null,
  clientName: 'Claude',
  scopes: ['decks:read'],
};

class RecordingFeature implements McpFeatureContributor {
  readonly callers: McpCaller[] = [];

  constructor(private readonly toolName: string) {}

  register(server: McpServer, caller: McpCaller): void {
    this.callers.push(caller);
    server.registerTool(this.toolName, { description: `The ${this.toolName} tool.` }, () => ({
      content: [{ type: 'text', text: caller.userId }],
    }));
  }
}

async function connect(server: McpServer): Promise<Client> {
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await server.connect(serverSide);
  const client = new Client({ name: 'test', version: '1.0.0' });
  await client.connect(clientSide);
  return client;
}

describe('McpServerFactory', () => {
  it('registers every feature module on the new server', async () => {
    const factory = new McpServerFactory({
      list: () => [new RecordingFeature('one'), new RecordingFeature('two')],
    });

    const client = await connect(
      factory.create({ era: 'modern', authInfo: toAuthInfo(CALLER, 1) }),
    );
    const { tools } = await client.listTools();

    expect(tools.map((tool) => tool.name)).toEqual(['one', 'two']);
    await client.close();
  });

  it('binds every feature to the verified caller of this request', () => {
    const feature = new RecordingFeature('one');
    const factory = new McpServerFactory({ list: () => [feature] });

    factory.create({ era: 'legacy', authInfo: toAuthInfo(CALLER, 1) });

    expect(feature.callers).toEqual([CALLER]);
  });

  it('builds a separate server for every request', () => {
    const factory = new McpServerFactory({ list: () => [] });
    const context = { era: 'modern' as const, authInfo: toAuthInfo(CALLER, 1) };

    expect(factory.create(context)).not.toBe(factory.create(context));
  });

  it('introduces itself as Deck Club with instructions for the AI', async () => {
    const factory = new McpServerFactory({ list: () => [new RecordingFeature('one')] });

    const client = await connect(
      factory.create({ era: 'modern', authInfo: toAuthInfo(CALLER, 1) }),
    );

    expect(client.getServerVersion()).toMatchObject({ name: SERVER_INFO.name, title: 'Deck Club' });
    expect(client.getInstructions()).toContain('list_decks');
    await client.close();
  });

  it('refuses to build a server for a request that skipped the auth gate', () => {
    const factory = new McpServerFactory({ list: () => [] });

    expect(() => factory.create({ era: 'modern' })).toThrow(/verified caller/);
  });
});
