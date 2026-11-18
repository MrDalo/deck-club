import type { McpServer } from '@modelcontextprotocol/server';
import { DiscoveryService } from '@nestjs/core';
import type { McpCaller } from './mcp-caller.js';

/**
 * A slice of the MCP surface owned by one feature module (decks, study,
 * clubs, widgets). The MCP server module discovers every provider marked
 * with {@link McpFeature} and asks each to register on the fresh,
 * caller-bound server it builds for every HTTP request.
 */
export type McpFeatureContributor = {
  /**
   * Registers this feature's tools, resources and prompts.
   * @param server - a new server serving exactly one HTTP request
   * @param caller - the verified caller that request belongs to
   */
  register(server: McpServer, caller: McpCaller): void;
};

/** Marks a provider as an {@link McpFeatureContributor}; add the module to AppModule and it is served. */
export const McpFeature = DiscoveryService.createDecorator();

/**
 * Type guard for discovered instances.
 * @param value - a discovered provider instance
 * @returns whether it can register MCP capabilities
 */
export function isMcpFeatureContributor(value: unknown): value is McpFeatureContributor {
  return (
    typeof value === 'object' &&
    value !== null &&
    'register' in value &&
    typeof value.register === 'function'
  );
}
