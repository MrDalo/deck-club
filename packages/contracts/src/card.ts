import { z } from 'zod';
import { IdSchema, plainText, TagListSchema, TimestampSchema } from './text.js';

/**
 * How a card is shown (product spec 3). Phase 1 ships Basic and Reversible;
 * Cloze and Type-in arrive in Phase 2 and are added here, never renamed.
 */
export const CARD_TYPES = ['basic', 'reversible'] as const;
export const CardTypeSchema = z.enum(CARD_TYPES);
export type CardType = z.infer<typeof CardTypeSchema>;

/** Where a write came from: the user in the app, or the user through a named AI client. */
export const CARD_SOURCES = ['app', 'mcp'] as const;
export const CardSourceSchema = z.enum(CARD_SOURCES);
export type CardSource = z.infer<typeof CardSourceSchema>;

/** Length limits for card fields, shared by the editor, the API and the MCP tool descriptions. */
export const CARD_LIMITS = {
  front: { min: 1, max: 2000 },
  back: { min: 1, max: 2000 },
  extra: { min: 0, max: 2000 },
  /** Most cards one `add_cards` call or bulk request may create (product spec 9). */
  perBatch: 100,
} as const;

/** Provenance: every card records who created it (product spec 3, "Rules that hold everywhere"). */
export const ProvenanceSchema = z.object({
  source: CardSourceSchema,
  /** The AI client's name ("Claude", "ChatGPT") when `source` is `mcp`, else null. */
  clientName: z.string().nullable(),
});
export type Provenance = z.infer<typeof ProvenanceSchema>;

/** A card as every client sees it. */
export const CardSchema = z.object({
  id: IdSchema,
  deckId: IdSchema,
  type: CardTypeSchema,
  front: z.string(),
  back: z.string(),
  extra: z.string(),
  tags: z.array(z.string()),
  provenance: ProvenanceSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type Card = z.infer<typeof CardSchema>;

/** One new card: the body of `POST /decks/:deckId/cards` and an item of `add_cards`. */
export const CreateCardInputSchema = z.object({
  type: CardTypeSchema.default('basic'),
  front: plainText(CARD_LIMITS.front),
  back: plainText(CARD_LIMITS.back),
  extra: plainText(CARD_LIMITS.extra).default(''),
  tags: TagListSchema.default([]),
});
export type CreateCardInput = z.input<typeof CreateCardInputSchema>;
export type CreateCardCommand = z.output<typeof CreateCardInputSchema>;

/** Body of `POST /decks/:deckId/cards/batch`: up to 100 cards in one call. */
export const AddCardsInputSchema = z.object({
  cards: z.array(CreateCardInputSchema).min(1).max(CARD_LIMITS.perBatch),
});
export type AddCardsInput = z.input<typeof AddCardsInputSchema>;

/** Body of `PATCH /decks/:deckId/cards/:cardId`. Editing content keeps study state (spec 3). */
export const UpdateCardInputSchema = z
  .object({
    front: plainText(CARD_LIMITS.front),
    back: plainText(CARD_LIMITS.back),
    extra: plainText(CARD_LIMITS.extra),
    tags: TagListSchema,
  })
  .partial()
  .refine((patch) => Object.keys(patch).length > 0, { message: 'Change at least one field.' });
export type UpdateCardInput = z.input<typeof UpdateCardInputSchema>;
export type UpdateCardCommand = z.output<typeof UpdateCardInputSchema>;

/** Response of `GET /decks/:deckId/cards` and of the batch create. */
export const CardListSchema = z.object({ cards: z.array(CardSchema) });
export type CardList = z.infer<typeof CardListSchema>;
