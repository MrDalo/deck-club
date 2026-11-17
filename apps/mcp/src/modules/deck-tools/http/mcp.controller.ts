import { Controller, Delete, Get, HttpCode, Inject, Post, Req, Res } from '@nestjs/common';
import { parseBearerToken } from '@deck-club/contracts';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ClientNameRegistry } from '../application/client-name-registry.js';
import { resolveClientName } from '../application/client-name.js';
import { DeckToolsService } from '../application/deck-tools.service.js';
import { createMcpServer } from './create-mcp-server.js';

/** JSON-RPC error code for a missing credential; protocol errors are only for auth and malformed calls. */
const UNAUTHORIZED_RPC_CODE = -32001;

/**
 * Reads `clientInfo.name` when the request is the MCP `initialize` call.
 * @param body - the parsed JSON-RPC body
 * @returns the client's self-reported name, if present
 */
function handshakeClientName(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null || !('params' in body)) return undefined;
  const params: unknown = body.params;
  if (typeof params !== 'object' || params === null || !('clientInfo' in params)) return undefined;
  const clientInfo: unknown = params.clientInfo;
  if (typeof clientInfo !== 'object' || clientInfo === null || !('name' in clientInfo))
    return undefined;
  return typeof clientInfo.name === 'string' ? clientInfo.name : undefined;
}

/**
 * The MCP endpoint: Streamable HTTP, stateless, JSON responses. The user's
 * Supabase access token is the bearer; the core API verifies it on every
 * tool call. OAuth 2.1 discovery replaces the pasted token in a later slice.
 */
@Controller('mcp')
export class McpController {
  constructor(
    @Inject(DeckToolsService) private readonly tools: DeckToolsService,
    @Inject(ClientNameRegistry) private readonly clientNames: ClientNameRegistry,
  ) {}

  @Post()
  async handle(@Req() request: FastifyRequest, @Res() reply: FastifyReply): Promise<void> {
    const accessToken = parseBearerToken(request.headers.authorization);
    if (accessToken === null) {
      await reply
        .status(401)
        .header('www-authenticate', 'Bearer realm="deck-club"')
        .send({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: UNAUTHORIZED_RPC_CODE,
            message: 'Sign in to Deck Club and send your access token as a Bearer token.',
          },
        });
      return;
    }

    const clientName = this.identifyClient(accessToken, request);
    const server = createMcpServer(this.tools, { accessToken, clientName });
    const transport = new StreamableHTTPServerTransport({ enableJsonResponse: true }); // no sessionIdGenerator: stateless;

    reply.hijack();
    reply.raw.on('close', () => {
      void transport.close();
      void server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(request.raw, reply.raw, request.body);
  }

  /** Names the AI client: from this request's handshake, else the one remembered for this token, else the User-Agent. */
  private identifyClient(accessToken: string, request: FastifyRequest): string {
    const handshake = handshakeClientName(request.body);
    const clientName = resolveClientName(
      handshake ?? this.clientNames.recall(accessToken),
      request.headers['user-agent'],
    );
    if (handshake !== undefined) this.clientNames.remember(accessToken, clientName);
    return clientName;
  }

  /** Stateless server: no server-initiated stream and no sessions to end. */
  @Get()
  @HttpCode(405)
  streamNotSupported(): { error: string } {
    return { error: 'This MCP server is stateless; send JSON-RPC requests with POST.' };
  }

  @Delete()
  @HttpCode(405)
  sessionsNotSupported(): { error: string } {
    return { error: 'This MCP server is stateless; there is no session to delete.' };
  }
}
