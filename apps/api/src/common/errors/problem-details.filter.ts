import { randomUUID } from 'node:crypto';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { ERROR_CODES, type ErrorCode, type ProblemDetails } from '@deck-club/contracts';
import type { FastifyReply } from 'fastify';
import { AppError } from './app-error.js';

const HTTP_STATUS_CODES: Readonly<Record<number, ErrorCode>> = {
  400: 'VALIDATION_FAILED',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'ROUTE_NOT_FOUND',
};

/**
 * Converts any thrown value into an RFC 9457 problem-details body.
 * @param error - whatever a controller, guard or service threw
 * @param traceId - the id the response and the log line share
 * @returns the response body; `status` is the HTTP status to send
 */
export function toProblemDetails(error: unknown, traceId: string): ProblemDetails {
  if (error instanceof AppError) {
    return {
      type: `https://deck.club/problems/${error.code.toLowerCase()}`,
      title: error.code,
      status: ERROR_CODES[error.code],
      code: error.code,
      detail: error.detail,
      traceId,
      ...(error.issues !== undefined && { issues: [...error.issues] }),
    };
  }
  if (error instanceof HttpException) {
    const code = HTTP_STATUS_CODES[error.getStatus()] ?? 'INTERNAL';
    return toProblemDetails(new AppError(code, error.message), traceId);
  }
  return toProblemDetails(new AppError('INTERNAL', 'Something went wrong on our side.'), traceId);
}

/** The single exception filter: every error leaves the API in the same shape (rule 20-backend). */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger('http');

  catch(error: unknown, host: ArgumentsHost): void {
    const traceId = randomUUID();
    const problem = toProblemDetails(error, traceId);
    if (problem.status >= 500) {
      const name = error instanceof Error ? error.name : typeof error;
      this.logger.error({
        evt: 'http.unhandled',
        traceId,
        errorName: name,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
    const reply = host.switchToHttp().getResponse<FastifyReply>();
    void reply
      .status(problem.status)
      .header('content-type', 'application/problem+json')
      .send(problem);
  }
}
