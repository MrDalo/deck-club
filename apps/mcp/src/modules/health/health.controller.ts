import { Controller, Get, Inject } from '@nestjs/common';
import type { Health } from '@deck-club/contracts';
import { ENV, type Env } from '../../config/env.js';

/** Liveness for Docker and uptime checks. Public; reveals only the deploy version. */
@Controller('health')
export class HealthController {
  constructor(@Inject(ENV) private readonly env: Env) {}

  @Get()
  get(): Health {
    return { status: 'ok', service: 'mcp', version: this.env.GIT_SHA };
  }
}
