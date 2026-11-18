import { HealthSchema } from '@deck-club/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { HealthCheck, type HealthProbe } from '../../../common/health/health-probe.js';
import { DeckClubApiClient } from '../../../infra/deck-club-api/deck-club-api-client.js';

/** Every tool calls the core API, so the MCP server is only ready while the API answers. */
@HealthCheck()
@Injectable()
export class ApiHealthProbe implements HealthProbe {
  readonly name = 'api';

  constructor(@Inject(DeckClubApiClient) private readonly api: DeckClubApiClient) {}

  async check(): Promise<void> {
    await this.api.send({ method: 'GET', path: '/health', schema: HealthSchema });
  }
}
