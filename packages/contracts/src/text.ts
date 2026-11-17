import { z } from 'zod';

/**
 * Card and deck text is stored and rendered as plain text, never HTML
 * (product spec 9 and 11: "no HTML or script content"). A tag-like
 * sequence is rejected at the boundary so neither the UI nor an AI client
 * can smuggle markup into a deck that other club members will render.
 */
const MARKUP_PATTERN = /<\s*\/?\s*[a-z!][^>]*>/i;

/** Error message the boundary returns when text contains markup. */
export const PLAIN_TEXT_MESSAGE = 'Text must be plain: HTML tags are not allowed.';

/**
 * A trimmed plain-text string between `min` and `max` characters.
 * @param limits - the inclusive length bounds after trimming
 * @returns a Zod schema that trims, bounds and rejects markup
 */
export function plainText(limits: { min: number; max: number }): z.ZodString {
  return z
    .string()
    .trim()
    .min(limits.min)
    .max(limits.max)
    .refine((value) => !MARKUP_PATTERN.test(value), { message: PLAIN_TEXT_MESSAGE });
}

/** A short lowercase label used to group decks and cards. */
const TagSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(32)
  .regex(
    /^[\p{L}\p{N}][\p{L}\p{N} _-]*$/u,
    'Tags use letters, numbers, spaces, dashes and underscores.',
  );

/** At most ten distinct tags; duplicates collapse. */
export const TagListSchema = z
  .array(TagSchema)
  .max(10)
  .transform((tags) => [...new Set(tags)]);

/** A BCP 47 language tag of the simple form `en`, `es`, `pt-BR`. */
export const LanguageSchema = z
  .string()
  .regex(/^[a-z]{2,3}(-[A-Z]{2})?$/, 'Use a language code such as en, sk or pt-BR.');

/** Entity identifiers are UUIDs. */
export const IdSchema = z.uuid();

/** Timestamps cross the boundary as ISO 8601 strings. */
export const TimestampSchema = z.iso.datetime();
