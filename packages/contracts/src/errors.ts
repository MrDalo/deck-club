import { z } from 'zod';

/**
 * Machine-readable error codes. Additive forever: a code is never renamed or
 * given a new meaning, because AI clients and old web builds match on it
 * (rule 15-contracts). Each code carries the HTTP status the API maps it to.
 */
export const ERROR_CODES = {
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  ROUTE_NOT_FOUND: 404,
  DECK_NOT_FOUND: 404,
  CARD_NOT_FOUND: 404,
  /** A review asked for the reverse side of a card that is not reversible. */
  DIRECTION_NOT_STUDIED: 422,
  /** Undo was asked for, but there is no rating from today to take back. */
  NOTHING_TO_UNDO: 409,
  INTERNAL: 500,
  UPSTREAM_UNAVAILABLE: 503,
} as const;
export type ErrorCode = keyof typeof ERROR_CODES;

const ERROR_CODE_NAMES = Object.keys(ERROR_CODES) as [ErrorCode, ...ErrorCode[]];
export const ErrorCodeSchema = z.enum(ERROR_CODE_NAMES);

/** One field-level problem inside a VALIDATION_FAILED response. */
export const FieldIssueSchema = z.object({
  path: z.string(),
  message: z.string(),
});
export type FieldIssue = z.infer<typeof FieldIssueSchema>;

/**
 * RFC 9457 problem details, the body of every error response. `detail` is a
 * short human-readable sentence an AI client can relay to its user as is.
 */
export const ProblemDetailsSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  code: ErrorCodeSchema,
  detail: z.string(),
  traceId: z.string(),
  issues: z.array(FieldIssueSchema).optional(),
});
export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>;
