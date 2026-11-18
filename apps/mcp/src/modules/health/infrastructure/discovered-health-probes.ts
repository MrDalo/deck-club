import { Inject, Injectable } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { discoverProviders } from '../../../common/discovery/discover-providers.js';
import {
  HealthCheck,
  type HealthProbe,
  isHealthProbe,
} from '../../../common/health/health-probe.js';
import type { ProbeSource } from '../application/readiness.service.js';

/**
 * Finds every provider marked `@HealthCheck()` in any module, so a module
 * adds a readiness check without the health module knowing it. Resolved on
 * first use, after the application has bootstrapped.
 */
@Injectable()
export class DiscoveredHealthProbes implements ProbeSource {
  private probes: readonly HealthProbe[] | null = null;

  constructor(@Inject(DiscoveryService) private readonly discovery: DiscoveryService) {}

  list(): readonly HealthProbe[] {
    this.probes ??= discoverProviders(this.discovery, HealthCheck, isHealthProbe);
    return this.probes;
  }
}
