import { McpServer, type McpRequestContext } from '@modelcontextprotocol/server';
import { callerFromAuthInfo } from '../../../common/mcp/mcp-caller.js';
import type { McpFeatureContributor } from '../../../common/mcp/mcp-feature.js';
import { SERVER_INFO, SERVER_INSTRUCTIONS } from './server-identity.js';

/** Where the feature contributors come from; the Nest adapter discovers them. */
export type FeatureSource = {
  list(): readonly McpFeatureContributor[];
};

/**
 * Builds the MCP server for one HTTP request (stateless, ADR 0004): a fresh
 * instance bound to that request's verified caller, with every feature
 * module's tools, resources and prompts. Nothing survives the request, so
 * one user's token can never reach another user's call, and any replica can
 * serve any request.
 */
export class McpServerFactory {
  /** @param features - the feature modules contributing the MCP surface */
  constructor(private readonly features: FeatureSource) {}

  /**
   * @param context - the SDK's per-request context; `authInfo` comes from the auth gate
   * @returns the server for this request
   * @throws Error when the request skipped the auth gate
   */
  create(context: McpRequestContext): McpServer {
    const caller = callerFromAuthInfo(context.authInfo);
    const server = new McpServer(SERVER_INFO, { instructions: SERVER_INSTRUCTIONS });
    for (const feature of this.features.list()) feature.register(server, caller);
    return server;
  }
}
