import { Controller, Get, Inject, Res } from '@nestjs/common';
import type { Health, Readiness } from '@deck-club/contracts';
import type { FastifyReply } from 'fastify';
import { ENV, type Env } from '../../../config/env.js';
import { ReadinessService } from '../application/readiness.service.js';

/**
 * Liveness and readiness for Docker, orchestrators and uptime checks.
 * Public; reveals only the deploy version and which dependencies answer.
 */
@Controller('health')
export class HealthController {
  constructor(
    @Inject(ENV) private readonly env: Env,
    @Inject(ReadinessService) private readonly readiness: ReadinessService,
  ) {}

  /** Liveness: the process is up and serving HTTP. Never checks dependencies, so it cannot flap. */
  @Get()
  live(): Health {
    return { status: 'ok', service: 'mcp', version: this.env.GIT_SHA };
  }

  /** Readiness: 200 when the core API and Supabase Auth answer, 503 otherwise. */
  @Get('ready')
  async ready(@Res({ passthrough: true }) reply: FastifyReply): Promise<Readiness> {
    const report = await this.readiness.report();
    void reply.status(report.status === 'ready' ? 200 : 503).header('cache-control', 'no-store');
    return report;
  }
}
