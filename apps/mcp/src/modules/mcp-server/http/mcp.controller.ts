import { Controller, Delete, Get, Inject, Post, Req, Res } from '@nestjs/common';
import { originValidationResponse } from '@modelcontextprotocol/server';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { abortWhenClientLeaves, toWebRequest } from '../../../common/http/fetch-bridge.js';
import { withClientName } from '../../../common/mcp/mcp-caller.js';
import { allowedOriginHostnames, ENV, type Env } from '../../../config/env.js';
import { AuthFacade } from '../../auth/auth.facade.js';
import { ClientNameRegistry } from '../application/client-name-registry.js';
import { resolveClientName } from '../application/client-name.js';
import { handshakeClientName } from './handshake-client-name.js';
import { McpEndpoint } from './mcp-endpoint.js';

/**
 * The MCP endpoint: Streamable HTTP, stateless (MCP SDK v2). Every request
 * passes, in order: Origin validation (DNS-rebinding protection, required
 * by the transport spec), the OAuth 2.1 bearer gate (401 + discovery
 * challenge), client naming for provenance, then the SDK handler.
 */
@Controller('mcp')
export class McpController {
  private readonly allowedOrigins: string[];

  constructor(
    @Inject(AuthFacade) private readonly auth: AuthFacade,
    @Inject(McpEndpoint) private readonly endpoint: McpEndpoint,
    @Inject(ClientNameRegistry) private readonly clientNames: ClientNameRegistry,
    @Inject(ENV) env: Env,
  ) {
    this.allowedOrigins = allowedOriginHostnames(env);
  }

  /** JSON-RPC requests and notifications. */
  @Post()
  post(@Req() request: FastifyRequest, @Res() reply: FastifyReply): Promise<FastifyReply> {
    return this.serve(request, reply);
  }

  /** A 2025-era client opening a server stream; the SDK answers 405 (stateless). */
  @Get()
  get(@Req() request: FastifyRequest, @Res() reply: FastifyReply): Promise<FastifyReply> {
    return this.serve(request, reply);
  }

  /** A 2025-era client ending a session; the SDK answers 405 (no sessions). */
  @Delete()
  delete(@Req() request: FastifyRequest, @Res() reply: FastifyReply): Promise<FastifyReply> {
    return this.serve(request, reply);
  }

  private async serve(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const webRequest = toWebRequest(request, abortWhenClientLeaves(reply));
    const foreignOrigin = originValidationResponse(webRequest, this.allowedOrigins);
    if (foreignOrigin !== undefined) return reply.send(foreignOrigin);

    const outcome = await this.auth.authenticate(request.headers.authorization);
    if (!outcome.authenticated) return reply.send(outcome.challenge);

    const clientName = this.identifyClient(outcome.authInfo.token, request);
    const response = await this.endpoint.serve(webRequest, {
      authInfo: withClientName(outcome.authInfo, clientName),
      parsedBody: request.body,
    });
    return reply.send(response);
  }

  /** The handshake name of this request, else the one remembered for the token, else the User-Agent. */
  private identifyClient(accessToken: string, request: FastifyRequest): string {
    const handshake = handshakeClientName(request.body);
    const clientName = resolveClientName(
      handshake ?? this.clientNames.recall(accessToken),
      request.headers['user-agent'],
    );
    if (handshake !== undefined) this.clientNames.remember(accessToken, clientName);
    return clientName;
  }
}
