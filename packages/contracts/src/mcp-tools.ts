import { z } from 'zod';
import { CARD_LIMITS, CreateCardInputSchema } from './card.js';
import { CreateDeckInputSchema } from './deck.js';
import { IdSchema } from './text.js';

/**
 * MCP tool names (product spec 9). Additive forever: an AI client may have a
 * saved prompt that names a tool, so a tool is never renamed.
 */
export const MCP_TOOL_NAMES = ['list_decks', 'get_deck', 'create_deck', 'add_cards'] as const;
export type McpToolName = (typeof MCP_TOOL_NAMES)[number];

const DeckIdArgument = IdSchema.describe('The deck id, as returned by list_decks or create_deck.');

/** `list_decks` takes no arguments. */
export const ListDecksToolInputSchema = z.object({});

/** `get_deck` arguments. */
export const GetDeckToolInputSchema = z.object({ deckId: DeckIdArgument });
export type GetDeckToolInput = z.infer<typeof GetDeckToolInputSchema>;

/** `create_deck` arguments: the same shape as the web form, with descriptions written for the AI. */
export const CreateDeckToolInputSchema = z.object({
  title: CreateDeckInputSchema.shape.title.describe(
    'Short deck name, for example "Spanish A1 verbs".',
  ),
  description: CreateDeckInputSchema.shape.description.describe(
    'Optional one-sentence summary of what the deck covers.',
  ),
  language: CreateDeckInputSchema.shape.language.describe(
    'Language code of the card content, for example en, es, sk.',
  ),
  tags: CreateDeckInputSchema.shape.tags.describe('Optional lowercase topic tags, at most 10.'),
});
export type CreateDeckToolInput = z.infer<typeof CreateDeckToolInputSchema>;

/** `add_cards` arguments: a deck and up to 100 cards. */
export const AddCardsToolInputSchema = z.object({
  deckId: DeckIdArgument,
  cards: z
    .array(CreateCardInputSchema)
    .min(1)
    .max(CARD_LIMITS.perBatch)
    .describe(
      `1 to ${CARD_LIMITS.perBatch} cards. One fact per card, short answers. type is "basic" (front to back) or "reversible" (studied in both directions). Plain text only, no HTML.`,
    ),
});
export type AddCardsToolInput = z.infer<typeof AddCardsToolInputSchema>;
