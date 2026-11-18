import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { ENV, type Env } from '../../config/env.js';
import { ReadinessService } from './application/readiness.service.js';
import { HealthController } from './http/health.controller.js';
import { ApiHealthProbe } from './infrastructure/api-health.probe.js';
import { DiscoveredHealthProbes } from './infrastructure/discovered-health-probes.js';

/** `GET /health` (liveness) and `GET /health/ready` (readiness over every discovered probe). */
@Module({
  imports: [DiscoveryModule],
  controllers: [HealthController],
  providers: [
    ApiHealthProbe,
    DiscoveredHealthProbes,
    {
      provide: ReadinessService,
      inject: [DiscoveredHealthProbes, ENV],
      useFactory: (probes: DiscoveredHealthProbes, env: Env) =>
        new ReadinessService(probes, { service: 'mcp', version: env.GIT_SHA }),
    },
  ],
})
export class HealthModule {}
