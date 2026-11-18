import {
  type CallHandler,
  type ExecutionContext,
  Inject,
  Injectable,
  type NestInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { IDEMPOTENCY_KEY_HEADER, IDEMPOTENT_REPLAYED_HEADER } from '@deck-club/contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { from, lastValueFrom, map, type Observable } from 'rxjs';
import { AppError } from '../errors/app-error.js';
import { fingerprintOf, parseIdempotencyKey } from './idempotency-policy.js';
import { IdempotencyService } from './idempotency.service.js';

/**
 * Honours the optional `Idempotency-Key` header on a write. Without it the
 * route runs as usual. With it, the route runs at most once per user and
 * key; a retry gets the stored response, marked `Idempotent-Replayed: true`.
 * Runs after the AuthGuard, so the key is always the verified user's.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(@Inject(IdempotencyService) private readonly idempotency: IdempotencyService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<FastifyRequest>();
    const key = parseIdempotencyKey(request.headers[IDEMPOTENCY_KEY_HEADER]);
    if (key === null) return next.handle();
    if (request.user === undefined) throw new AppError('UNAUTHENTICATED', 'Sign in to continue.');

    const outcome = this.idempotency.run(
      {
        userId: request.user.id,
        key,
        fingerprint: fingerprintOf({
          method: request.method,
          url: request.url,
          body: request.body,
        }),
      },
      () => lastValueFrom(next.handle(), { defaultValue: undefined }),
    );
    return from(outcome).pipe(
      map(({ body, replayed }) => {
        if (replayed)
          void http.getResponse<FastifyReply>().header(IDEMPOTENT_REPLAYED_HEADER, 'true');
        return body;
      }),
    );
  }
}

/**
 * Marks a write route as accepting an `Idempotency-Key` (product spec 9).
 * Use it on writes whose retry would change something again, such as
 * creating cards or recording a review; the route must also be guarded by
 * the AuthGuard.
 * @returns the route decorator
 */
export const Idempotent = (): MethodDecorator & ClassDecorator =>
  UseInterceptors(IdempotencyInterceptor);
