import { Inject, Injectable } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { discoverProviders } from '../../../common/discovery/discover-providers.js';
import {
  isMcpFeatureContributor,
  McpFeature,
  type McpFeatureContributor,
} from '../../../common/mcp/mcp-feature.js';
import type { FeatureSource } from '../application/mcp-server-factory.js';

/**
 * Finds every provider marked `@McpFeature()` in any module: importing a
 * feature module into AppModule is all it takes to serve its tools.
 * Resolved on first request, after the application has bootstrapped.
 */
@Injectable()
export class DiscoveredMcpFeatures implements FeatureSource {
  private features: readonly McpFeatureContributor[] | null = null;

  constructor(@Inject(DiscoveryService) private readonly discovery: DiscoveryService) {}

  list(): readonly McpFeatureContributor[] {
    this.features ??= discoverProviders(this.discovery, McpFeature, isMcpFeatureContributor);
    return this.features;
  }
}
