import { type ErrorCode, type FieldIssue } from '@deck-club/contracts';

/**
 * The one error type application services throw. It carries a stable code
 * from the contracts catalogue and a sentence an AI client can relay to its
 * user verbatim; the problem-details filter turns it into an RFC 9457 body.
 */
export class AppError extends Error {
  /**
   * @param code - the catalogue code; decides the HTTP status
   * @param detail - one human-readable sentence, never containing card content
   * @param issues - field-level problems for VALIDATION_FAILED
   */
  constructor(
    readonly code: ErrorCode,
    readonly detail: string,
    readonly issues?: readonly FieldIssue[],
  ) {
    super(`${code}: ${detail}`);
    this.name = 'AppError';
  }
}
