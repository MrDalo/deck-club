import {
  AddCardsToolInputSchema,
  CreateDeckToolInputSchema,
  GetDeckToolInputSchema,
  ListDecksToolInputSchema,
} from '@deck-club/contracts';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { DeckToolsService, ToolResult } from '../application/deck-tools.service.js';
import type { ApiCaller } from '../application/ports/deck-club-api.js';
import { TOOL_DESCRIPTIONS } from '../application/tool-descriptions.js';

/** Version reported in the MCP handshake. */
const SERVER_VERSION = '0.1.0';

const toCallResult = (result: ToolResult): CallToolResult => ({
  content: [{ type: 'text', text: result.text }],
  isError: result.isError,
});

/**
 * Builds a stateless MCP server for one HTTP request, bound to the caller.
 * A fresh instance per request keeps the server horizontally scalable and
 * makes it impossible for one user's token to leak into another's call.
 * @param tools - the deck tools' use cases
 * @param caller - the user's token and AI client for this request
 * @returns a server with every deck tool registered
 */
export function createMcpServer(tools: DeckToolsService, caller: ApiCaller): McpServer {
  const server = new McpServer({ name: 'deck-club', version: SERVER_VERSION });

  server.registerTool(
    'list_decks',
    {
      ...TOOL_DESCRIPTIONS.list_decks,
      inputSchema: ListDecksToolInputSchema,
      annotations: { readOnlyHint: true },
    },
    async () => toCallResult(await tools.listDecks(caller)),
  );
  server.registerTool(
    'get_deck',
    {
      ...TOOL_DESCRIPTIONS.get_deck,
      inputSchema: GetDeckToolInputSchema,
      annotations: { readOnlyHint: true },
    },
    async (input) => toCallResult(await tools.getDeck(caller, input)),
  );
  server.registerTool(
    'create_deck',
    {
      ...TOOL_DESCRIPTIONS.create_deck,
      inputSchema: CreateDeckToolInputSchema,
      annotations: { readOnlyHint: false },
    },
    async (input) => toCallResult(await tools.createDeck(caller, input)),
  );
  server.registerTool(
    'add_cards',
    {
      ...TOOL_DESCRIPTIONS.add_cards,
      inputSchema: AddCardsToolInputSchema,
      annotations: { readOnlyHint: false },
    },
    async (input) => toCallResult(await tools.addCards(caller, input)),
  );

  return server;
}
