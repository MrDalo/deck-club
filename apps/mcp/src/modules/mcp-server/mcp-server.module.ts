import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { AuthModule } from '../auth/auth.module.js';
import { ClientNameRegistry } from './application/client-name-registry.js';
import { McpServerFactory } from './application/mcp-server-factory.js';
import { McpController } from './http/mcp.controller.js';
import { McpEndpoint } from './http/mcp-endpoint.js';
import { DiscoveredMcpFeatures } from './infrastructure/discovered-mcp-features.js';

/**
 * The MCP transport: `POST /mcp` over Streamable HTTP, stateless. It owns
 * no tools itself; feature modules contribute them through `@McpFeature()`.
 */
@Module({
  imports: [AuthModule, DiscoveryModule],
  controllers: [McpController],
  providers: [
    DiscoveredMcpFeatures,
    {
      provide: McpServerFactory,
      inject: [DiscoveredMcpFeatures],
      useFactory: (features: DiscoveredMcpFeatures) => new McpServerFactory(features),
    },
    { provide: ClientNameRegistry, useFactory: () => new ClientNameRegistry() },
    McpEndpoint,
  ],
})
export class McpServerModule {}
