import { z } from 'zod';
import { CardSchema } from './card.js';
import { IdSchema } from './text.js';

/**
 * Full-text search over a user's cards (product spec 9: `search_cards`, "used
 * to avoid duplicates"). The matching rule lives in the API's domain so the
 * MCP tool, the web app and duplicate detection can never disagree.
 */
export const CARD_SEARCH_LIMITS = {
  query: { min: 1, max: 200 },
  /** Most results one search returns; the default keeps an AI's context small. */
  results: { default: 20, max: 50 },
} as const;

/** The parts of a card a search looks in. */
export const CARD_SEARCH_FIELDS = ['front', 'back', 'extra', 'tags'] as const;
export const CardSearchFieldSchema = z.enum(CARD_SEARCH_FIELDS);
export type CardSearchField = z.infer<typeof CardSearchFieldSchema>;

/** Query of `GET /cards/search`. Numbers arrive as strings in a query string, hence `coerce`. */
export const CardSearchQuerySchema = z.object({
  q: z.string().trim().min(CARD_SEARCH_LIMITS.query.min).max(CARD_SEARCH_LIMITS.query.max),
  deckId: IdSchema.optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(CARD_SEARCH_LIMITS.results.max)
    .default(CARD_SEARCH_LIMITS.results.default),
});
export type CardSearchQuery = z.input<typeof CardSearchQuerySchema>;
export type CardSearchCommand = z.output<typeof CardSearchQuerySchema>;

/** One card that matches, with its deck's title and where the words were found. */
export const CardSearchHitSchema = z.object({
  card: CardSchema,
  deckTitle: z.string(),
  matchedIn: z.array(CardSearchFieldSchema),
});
export type CardSearchHit = z.infer<typeof CardSearchHitSchema>;

/** Response of `GET /cards/search`: the best matches first. */
export const CardSearchResultSchema = z.object({
  hits: z.array(CardSearchHitSchema),
  /** How many cards matched in total, beyond `limit`. */
  totalMatches: z.number().int().nonnegative(),
});
export type CardSearchResult = z.infer<typeof CardSearchResultSchema>;
