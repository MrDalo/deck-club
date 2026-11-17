/** Message keys under `validation` in messages/*.json. */
const KNOWN_ISSUE_KEYS = ['too_small', 'too_big', 'invalid_format', 'custom'] as const;
type ValidationMessageKey = (typeof KNOWN_ISSUE_KEYS)[number] | 'invalid';

/**
 * Maps a Zod issue code (react-hook-form's `error.type` via zodResolver) to a
 * translated message key, so the contracts schema stays the only validator
 * and the wording stays in the message catalogue.
 * @param issueType - the error type react-hook-form reports
 * @returns a key under `validation`
 */
export function validationMessageKey(issueType: string): ValidationMessageKey {
  return KNOWN_ISSUE_KEYS.find((key) => key === issueType) ?? 'invalid';
}
