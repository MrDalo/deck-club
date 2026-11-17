import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { AppError } from '../errors/app-error.js';
import type { AuthenticatedUser } from './access-token-verifier.js';

/** Injects the user the {@link AuthGuard} verified. Throws if a route forgot the guard. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    if (request.user === undefined) throw new AppError('UNAUTHENTICATED', 'Sign in to continue.');
    return request.user;
  },
);
