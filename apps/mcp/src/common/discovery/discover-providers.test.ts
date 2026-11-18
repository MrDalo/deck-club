import { Injectable, Module } from '@nestjs/common';
import { DiscoveryModule, DiscoveryService } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { HealthCheck, isHealthProbe } from '../health/health-probe.js';
import { isMcpFeatureContributor, McpFeature } from '../mcp/mcp-feature.js';
import { discoverProviders } from './discover-providers.js';

@McpFeature()
@Injectable()
class MarkedFeature {
  register(): void {
    // registers nothing
  }
}

@Injectable()
class UnmarkedFeature {
  register(): void {
    // registers nothing
  }
}

@McpFeature()
@Injectable()
class MarkedButMisshapen {}

@HealthCheck()
@Injectable()
class MarkedProbe {
  readonly name = 'api';

  check(): Promise<void> {
    return Promise.resolve();
  }
}

@Module({ providers: [MarkedFeature, UnmarkedFeature, MarkedButMisshapen, MarkedProbe] })
class SomeFeatureModule {}

async function discovery(): Promise<DiscoveryService> {
  const moduleRef = await Test.createTestingModule({
    imports: [DiscoveryModule, SomeFeatureModule],
  }).compile();
  return moduleRef.get(DiscoveryService);
}

describe('discoverProviders', () => {
  it('finds the marked providers of any module, of the right shape only', async () => {
    const found = discoverProviders(await discovery(), McpFeature, isMcpFeatureContributor);

    expect(found).toHaveLength(1);
    expect(found[0]).toBeInstanceOf(MarkedFeature);
  });

  it('keeps the two markers apart', async () => {
    const found = discoverProviders(await discovery(), HealthCheck, isHealthProbe);

    expect(found.map((probe) => probe.name)).toEqual(['api']);
  });
});

describe('type guards', () => {
  it('reject values without the expected members', () => {
    expect(isMcpFeatureContributor(null)).toBe(false);
    expect(isMcpFeatureContributor({ register: 'no' })).toBe(false);
    expect(isHealthProbe({ name: 'api' })).toBe(false);
    expect(isHealthProbe({ name: 1, check: () => undefined })).toBe(false);
  });
});
