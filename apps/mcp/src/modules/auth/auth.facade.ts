import { Inject, Injectable } from '@nestjs/common';
import { type AuthOutcome, BearerAuthenticator } from './application/bearer-authenticator.js';

export type { AuthOutcome } from './application/bearer-authenticator.js';

/**
 * The auth module's public face (rule 20-backend: modules meet only through
 * facades). The MCP endpoint asks it whether a request may proceed.
 */
@Injectable()
export class AuthFacade {
  constructor(@Inject(BearerAuthenticator) private readonly authenticator: BearerAuthenticator) {}

  /**
   * Checks the `Authorization` header of one MCP request.
   * @param authorization - the raw header value
   * @returns the verified auth info, or the challenge response to send as is
   */
  authenticate(authorization: string | undefined): Promise<AuthOutcome> {
    return this.authenticator.authenticate(authorization);
  }
}
