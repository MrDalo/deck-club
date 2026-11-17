import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { AppError } from './app-error.js';
import { toProblemDetails } from './problem-details.filter.js';

describe('toProblemDetails', () => {
  it('maps an AppError to its catalogue status and keeps the detail', () => {
    const problem = toProblemDetails(
      new AppError('DECK_NOT_FOUND', 'No deck with that id.'),
      'trace-1',
    );

    expect(problem).toMatchObject({
      status: 404,
      code: 'DECK_NOT_FOUND',
      detail: 'No deck with that id.',
      traceId: 'trace-1',
    });
  });

  it('carries field issues for VALIDATION_FAILED', () => {
    const issues = [{ path: 'title', message: 'Too short' }];
    const problem = toProblemDetails(
      new AppError('VALIDATION_FAILED', 'Invalid body.', issues),
      'trace-2',
    );

    expect(problem.issues).toEqual(issues);
  });

  it('maps a Nest 404 to ROUTE_NOT_FOUND', () => {
    expect(toProblemDetails(new NotFoundException(), 'trace-3').code).toBe('ROUTE_NOT_FOUND');
  });

  it('maps a Nest 401 to UNAUTHENTICATED', () => {
    expect(toProblemDetails(new UnauthorizedException(), 'trace-4').status).toBe(401);
  });

  it('hides the message of an unknown error behind INTERNAL', () => {
    const problem = toProblemDetails(new Error('connection string leaked'), 'trace-5');

    expect(problem).toMatchObject({ status: 500, code: 'INTERNAL' });
    expect(problem.detail).not.toContain('leaked');
  });
});
