import { Inject, Injectable } from '@nestjs/common';
import { HealthCheck, type HealthProbe } from '../../../common/health/health-probe.js';
import {
  AUTHORIZATION_SERVER,
  type AuthorizationServer,
} from '../application/ports/authorization-server.js';

/**
 * Readiness: AI clients can only sign in while the authorization server
 * publishes usable metadata. Uses the adapter's cache, so frequent probes
 * do not hammer Supabase.
 */
@HealthCheck()
@Injectable()
export class SupabaseAuthProbe implements HealthProbe {
  readonly name = 'supabase-auth';

  constructor(
    @Inject(AUTHORIZATION_SERVER) private readonly authorizationServer: AuthorizationServer,
  ) {}

  async check(): Promise<void> {
    await this.authorizationServer.metadata();
  }
}
