import { type CanActivate, type ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { parseBearerToken } from '@deck-club/contracts';
import type { FastifyRequest } from 'fastify';
import { AppError } from '../errors/app-error.js';
import {
  ACCESS_TOKEN_VERIFIER,
  type AccessTokenVerifier,
  type AuthenticatedUser,
} from './access-token-verifier.js';

declare module 'fastify' {
  // Module augmentation only merges into an interface.
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface FastifyRequest {
    /** Set by {@link AuthGuard} on every authenticated route. */
    user?: AuthenticatedUser;
  }
}

/** Server-side authorization on every request (product spec 11): no valid token, no access. */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(ACCESS_TOKEN_VERIFIER) private readonly verifier: AccessTokenVerifier) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = parseBearerToken(request.headers.authorization);
    if (token === null) throw new AppError('UNAUTHENTICATED', 'Sign in to continue.');
    const user = await this.verifier.verify(token);
    if (user === null)
      throw new AppError('UNAUTHENTICATED', 'Your session has expired. Sign in again.');
    request.user = user;
    return true;
  }
}
