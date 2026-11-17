import { z } from 'zod';
import { IdSchema, LanguageSchema, plainText, TagListSchema, TimestampSchema } from './text.js';

/** Who can see a deck (product spec 3, 10). Private is the default. */
export const DECK_VISIBILITIES = ['private', 'unlisted', 'public'] as const;
export const DeckVisibilitySchema = z.enum(DECK_VISIBILITIES);
export type DeckVisibility = z.infer<typeof DeckVisibilitySchema>;

/** Length limits for deck fields, shared by the form, the API and the MCP tool descriptions. */
export const DECK_LIMITS = {
  title: { min: 1, max: 120 },
  description: { min: 0, max: 500 },
} as const;

/** A deck as every client sees it. */
export const DeckSchema = z.object({
  id: IdSchema,
  title: z.string(),
  description: z.string(),
  language: LanguageSchema,
  tags: z.array(z.string()),
  visibility: DeckVisibilitySchema,
  cardCount: z.number().int().nonnegative(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type Deck = z.infer<typeof DeckSchema>;

/** Body of `POST /decks` and the `create_deck` MCP tool. */
export const CreateDeckInputSchema = z.object({
  title: plainText(DECK_LIMITS.title),
  description: plainText(DECK_LIMITS.description).default(''),
  language: LanguageSchema.default('en'),
  tags: TagListSchema.default([]),
});
export type CreateDeckInput = z.input<typeof CreateDeckInputSchema>;
export type CreateDeckCommand = z.output<typeof CreateDeckInputSchema>;

/** Body of `PATCH /decks/:deckId`. Every field optional; at least one required. */
export const UpdateDeckInputSchema = z
  .object({
    title: plainText(DECK_LIMITS.title),
    description: plainText(DECK_LIMITS.description),
    language: LanguageSchema,
    tags: TagListSchema,
    visibility: DeckVisibilitySchema,
  })
  .partial()
  .refine((patch) => Object.keys(patch).length > 0, { message: 'Change at least one field.' });
export type UpdateDeckInput = z.input<typeof UpdateDeckInputSchema>;
export type UpdateDeckCommand = z.output<typeof UpdateDeckInputSchema>;

/** Response of `GET /decks`. */
export const DeckListSchema = z.object({ decks: z.array(DeckSchema) });
export type DeckList = z.infer<typeof DeckListSchema>;
