import { MCP_SCOPES } from '@deck-club/contracts';
import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport, McpServer } from '@modelcontextprotocol/server';
import type { McpCaller } from '../mcp-caller.js';
import type { McpFeatureContributor } from '../mcp-feature.js';

/**
 * A caller holding every scope unless told otherwise.
 * @param overrides - fields to change
 * @returns the caller
 */
export function testCaller(overrides: Partial<McpCaller> = {}): McpCaller {
  return {
    accessToken: 'token-ana',
    userId: 'user-ana',
    clientId: 'claude-client',
    clientName: 'Claude',
    scopes: [...MCP_SCOPES],
    ...overrides,
  };
}

/**
 * Serves one feature module to a real MCP client over an in-memory
 * transport: the same protocol path as production, without HTTP.
 * @param feature - the feature under test
 * @param caller - the caller the server is bound to
 * @returns a connected client; close it at the end of the test
 */
export async function connectFeature(
  feature: McpFeatureContributor,
  caller = testCaller(),
): Promise<Client> {
  const server = new McpServer({ name: 'deck-club-test', version: '0.0.0' });
  feature.register(server, caller);
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await server.connect(serverSide);
  const client = new Client({ name: 'test-client', version: '0.0.0' });
  await client.connect(clientSide);
  return client;
}

/**
 * The text of a tool result's first content block.
 * @param result - a `tools/call` result
 * @returns the text, or an empty string
 */
export function textOf(result: { content?: unknown }): string {
  const [first] = (result.content ?? []) as { type: string; text?: string }[];
  return first?.text ?? '';
}
