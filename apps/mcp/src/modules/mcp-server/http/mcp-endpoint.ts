import { Inject, Injectable, Logger, type OnApplicationShutdown } from '@nestjs/common';
import {
  createMcpHandler,
  type McpHandlerRequestOptions,
  type McpHttpHandler,
} from '@modelcontextprotocol/server';
import { McpServerFactory } from '../application/mcp-server-factory.js';

/**
 * The MCP SDK v2 HTTP entry (`createMcpHandler`), created once per process.
 * It serves the stateless 2026-07-28 revision with a fresh server per
 * request, and 2025-era clients through the SDK's stateless fallback from
 * the same factory, so both eras always expose the same tools. GET and
 * DELETE (2025 session operations) are answered 405: there are no sessions.
 */
@Injectable()
export class McpEndpoint implements OnApplicationShutdown {
  private readonly logger = new Logger('mcp');
  private readonly handler: McpHttpHandler;

  constructor(@Inject(McpServerFactory) factory: McpServerFactory) {
    this.handler = createMcpHandler((context) => factory.create(context), {
      legacy: 'stateless',
      onerror: (error) => this.logger.warn({ evt: 'mcp.request.rejected', reason: error.message }),
    });
  }

  /**
   * Serves one authenticated MCP exchange.
   * @param request - the web request (method, URL, headers)
   * @param options - the verified auth info and the parsed JSON body
   * @returns the JSON or SSE response
   */
  serve(request: Request, options: McpHandlerRequestOptions): Promise<Response> {
    return this.handler.fetch(request, options);
  }

  /** Aborts in-flight exchanges so shutdown does not wait on open streams. */
  async onApplicationShutdown(): Promise<void> {
    await this.handler.close();
  }
}
