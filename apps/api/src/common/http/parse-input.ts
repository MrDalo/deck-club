import { IdSchema } from '@deck-club/contracts';
import type { ZodType } from 'zod';
import { AppError } from '../errors/app-error.js';

/**
 * Parses an untrusted request body with a contracts schema (rule 00-core:
 * every boundary input is parsed, never asserted).
 * @param schema - the contracts schema for this body
 * @param body - the raw body as Fastify parsed it
 * @returns the schema's output type
 * @throws AppError VALIDATION_FAILED with one issue per bad field
 */
export function parseBody<Output>(schema: ZodType<Output>, body: unknown): Output {
  const result = schema.safeParse(body);
  if (result.success) return result.data;
  const issues = result.error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
  throw new AppError('VALIDATION_FAILED', 'The request body is invalid.', issues);
}

/**
 * Parses an id from a route parameter. A malformed id is reported as "not
 * found" rather than "invalid", so probing ids reveals nothing.
 * @param raw - the route parameter
 * @param notFound - the error to throw when it is not a UUID
 * @returns the id
 */
export function parseId(raw: string, notFound: AppError): string {
  const result = IdSchema.safeParse(raw);
  if (!result.success) throw notFound;
  return result.data;
}
