import { z } from 'zod';
import {
  CARD_LIMITS,
  CardTypeSchema,
  CreateCardInputSchema,
  UpdateCardInputSchema,
} from './card.js';
import { CARD_SEARCH_LIMITS, CardSearchFieldSchema } from './card-search.js';
import { CreateDeckInputSchema, DeckVisibilitySchema } from './deck.js';
import { STUDY_DEFAULTS, SubmitReviewInputSchema } from './study.js';
import { IdSchema, LanguageSchema } from './text.js';

/**
 * OAuth scopes of an AI connection (product spec 9, "Connection and auth").
 * A tool refuses with FORBIDDEN when its scope was not granted.
 */
export const MCP_SCOPES = ['decks:read', 'decks:write', 'study', 'clubs'] as const;
export const McpScopeSchema = z.enum(MCP_SCOPES);
export type McpScope = z.infer<typeof McpScopeSchema>;

/**
 * MCP tool names (product spec 9). Additive forever: an AI client may have a
 * saved prompt that names a tool, so a tool is never renamed.
 */
export const MCP_TOOL_NAMES = [
  'list_decks',
  'get_deck',
  'search_cards',
  'create_deck',
  'add_cards',
  'update_card',
  'delete_cards',
  'get_due_cards',
  'submit_review',
  'get_stats',
  'list_clubs',
  'suggest_club_cards',
  'create_battle',
] as const;
export type McpToolName = (typeof MCP_TOOL_NAMES)[number];

/** The scope each tool needs (product spec 9, the "Scope" column). */
export const MCP_TOOL_SCOPES: Readonly<Record<McpToolName, McpScope>> = {
  list_decks: 'decks:read',
  get_deck: 'decks:read',
  search_cards: 'decks:read',
  create_deck: 'decks:write',
  add_cards: 'decks:write',
  update_card: 'decks:write',
  delete_cards: 'decks:write',
  get_due_cards: 'study',
  submit_review: 'study',
  get_stats: 'study',
  list_clubs: 'clubs',
  suggest_club_cards: 'clubs',
  create_battle: 'clubs',
};

const DeckIdArgument = IdSchema.describe('The deck id, as returned by list_decks or create_deck.');
const CardIdArgument = IdSchema.describe('The card id, as returned by get_deck or search_cards.');
const ClubIdArgument = IdSchema.describe('The club id, as returned by list_clubs.');

/**
 * A client-chosen key that makes a write safe to retry (product spec 9): a
 * second call with the same key returns the first result instead of creating
 * duplicates.
 */
export const IdempotencyKeySchema = z
  .string()
  .min(8)
  .max(128)
  .regex(/^[\w-]+$/, 'Use letters, digits, dashes and underscores.')
  .describe(
    'Optional. A unique key for this write, e.g. a UUID. Reuse it only when retrying the same call.',
  );

const CardBatchArgument = z
  .array(CreateCardInputSchema)
  .min(1)
  .max(CARD_LIMITS.perBatch)
  .describe(
    `1 to ${CARD_LIMITS.perBatch} cards. One fact per card, short answers. type is "basic" (front to back) or "reversible" (studied in both directions). Plain text only, no HTML.`,
  );

/** `list_decks` takes no arguments. */
export const ListDecksToolInputSchema = z.object({});
export type ListDecksToolInput = z.infer<typeof ListDecksToolInputSchema>;

/** One deck in the `list_decks` result, as the AI and its view both read it. */
export const DeckSummarySchema = z.object({
  id: IdSchema,
  title: z.string(),
  description: z.string(),
  language: LanguageSchema,
  cardCount: z.number().int().nonnegative(),
  /** Where the user opens this deck in the web app. */
  url: z.url(),
});
export type DeckSummary = z.infer<typeof DeckSummarySchema>;

/**
 * Structured result of `list_decks`: the tool's `outputSchema`, which the
 * MCP SDK validates, and the data its MCP Apps view renders.
 */
export const ListDecksOutputSchema = z.object({
  decks: z.array(DeckSummarySchema),
  deckCount: z.number().int().nonnegative(),
  /** The deck library in the web app. */
  libraryUrl: z.url(),
});
export type ListDecksOutput = z.infer<typeof ListDecksOutputSchema>;

/** `get_deck` arguments: a deck and an optional page cursor (spec 9: paginated). */
export const GetDeckToolInputSchema = z.object({
  deckId: DeckIdArgument,
  cursor: z
    .string()
    .min(1)
    .max(256)
    .optional()
    .describe('Optional. The nextCursor of a previous get_deck result, to read the next page.'),
});
export type GetDeckToolInput = z.infer<typeof GetDeckToolInputSchema>;

/** Most cards one `get_deck` page holds, so a large deck never floods the AI's context. */
export const DECK_PAGE_SIZE = 25;

/** One card in the `get_deck` result, as the AI and its view both read it. */
export const DeckCardSchema = z.object({
  id: IdSchema,
  type: CardTypeSchema,
  front: z.string(),
  back: z.string(),
  extra: z.string(),
  tags: z.array(z.string()),
  /** The AI client that created the card ("Added by Claude", spec 4.3), or null when a person did. */
  addedBy: z.string().nullable(),
});
export type DeckCard = z.infer<typeof DeckCardSchema>;

/**
 * Structured result of `get_deck`: one deck and one page of its cards. The
 * tool's `outputSchema`, and the data its MCP Apps view renders.
 */
export const GetDeckOutputSchema = z.object({
  deck: DeckSummarySchema,
  cards: z.array(DeckCardSchema).max(DECK_PAGE_SIZE),
  /** 1-based position of the page's first card in the deck. */
  firstCardNumber: z.number().int().positive(),
  /** Pass it back as `cursor` to read the next page; null on the last page. */
  nextCursor: z.string().nullable(),
});
export type GetDeckOutput = z.infer<typeof GetDeckOutputSchema>;

/** One `search_cards` match: the card, its deck, and where the words were found. */
export const CardMatchSchema = z.object({
  card: DeckCardSchema,
  deck: z.object({ id: IdSchema, title: z.string(), url: z.url() }),
  matchedIn: z.array(CardSearchFieldSchema),
});
export type CardMatch = z.infer<typeof CardMatchSchema>;

/**
 * Structured result of `search_cards`: the tool's `outputSchema`, and the data
 * its MCP Apps view renders. It echoes the search so the view can show it and
 * search again in the same scope.
 */
export const SearchCardsOutputSchema = z.object({
  query: z.string(),
  /** The deck the search was limited to, or null for every deck. */
  deckId: IdSchema.nullable(),
  matches: z.array(CardMatchSchema).max(CARD_SEARCH_LIMITS.results.max),
  /** How many cards matched in total, beyond the ones returned. */
  totalMatches: z.number().int().nonnegative(),
});
export type SearchCardsOutput = z.infer<typeof SearchCardsOutputSchema>;

/** `search_cards` arguments: full-text search across the user's cards (spec 9). */
export const SearchCardsToolInputSchema = z.object({
  query: z
    .string()
    .trim()
    .min(CARD_SEARCH_LIMITS.query.min)
    .max(CARD_SEARCH_LIMITS.query.max)
    .describe(
      'Words to look for on the front, back, extra or tags of a card. Every word must appear; case and accents are ignored.',
    ),
  deckId: DeckIdArgument.optional().describe('Optional. Search only this deck.'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(CARD_SEARCH_LIMITS.results.max)
    .default(CARD_SEARCH_LIMITS.results.default)
    .describe(`Most cards to return, 1 to ${CARD_SEARCH_LIMITS.results.max}.`),
});
export type SearchCardsToolInput = z.infer<typeof SearchCardsToolInputSchema>;

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

/** The deck `create_deck` made: its summary, with the tags and visibility it was created with. */
export const CreatedDeckSchema = DeckSummarySchema.extend({
  tags: z.array(z.string()),
  visibility: DeckVisibilitySchema,
});
export type CreatedDeck = z.infer<typeof CreatedDeckSchema>;

/** Structured result of `create_deck`: the tool's `outputSchema`, and the data its view renders. */
export const CreateDeckOutputSchema = z.object({
  deck: CreatedDeckSchema,
  /** The deck library in the web app. */
  libraryUrl: z.url(),
});
export type CreateDeckOutput = z.infer<typeof CreateDeckOutputSchema>;

/** `add_cards` arguments: a deck and up to 100 cards. */
export const AddCardsToolInputSchema = z.object({
  deckId: DeckIdArgument,
  cards: CardBatchArgument,
  idempotencyKey: IdempotencyKeySchema.optional(),
});
export type AddCardsToolInput = z.infer<typeof AddCardsToolInputSchema>;

/** `update_card` arguments: a card and the fields to change. Editing keeps study state (spec 3). */
export const UpdateCardToolInputSchema = z
  .object({
    deckId: DeckIdArgument,
    cardId: CardIdArgument,
    ...UpdateCardInputSchema.shape,
  })
  .refine(
    (input) =>
      [input.front, input.back, input.extra, input.tags].some((field) => field !== undefined),
    { message: 'Change at least one of front, back, extra or tags.' },
  );
export type UpdateCardToolInput = z.infer<typeof UpdateCardToolInputSchema>;

/** `delete_cards` arguments: cards of one deck to soft-delete (restorable for 30 days, spec 3). */
export const DeleteCardsToolInputSchema = z.object({
  deckId: DeckIdArgument,
  cardIds: z
    .array(CardIdArgument)
    .min(1)
    .max(CARD_LIMITS.perBatch)
    .describe(`1 to ${CARD_LIMITS.perBatch} card ids from this deck.`),
});
export type DeleteCardsToolInput = z.infer<typeof DeleteCardsToolInputSchema>;

/** `get_due_cards` arguments: the next cards in session order, within daily limits (spec 6). */
export const GetDueCardsToolInputSchema = z.object({
  deckId: DeckIdArgument.optional().describe(
    'Optional. Only cards of this deck; all decks if omitted.',
  ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(STUDY_DEFAULTS.maxDueCardsPerRequest)
    .default(10)
    .describe(`How many cards to fetch, 1 to ${STUDY_DEFAULTS.maxDueCardsPerRequest}.`),
});
export type GetDueCardsToolInput = z.infer<typeof GetDueCardsToolInputSchema>;

/** `submit_review` arguments: exactly the body of `POST /study/reviews`. */
export const SubmitReviewToolInputSchema = SubmitReviewInputSchema;
export type SubmitReviewToolInput = z.infer<typeof SubmitReviewToolInputSchema>;

/** `get_stats` takes no arguments. */
export const GetStatsToolInputSchema = z.object({});
export type GetStatsToolInput = z.infer<typeof GetStatsToolInputSchema>;

/** `list_clubs` takes no arguments. */
export const ListClubsToolInputSchema = z.object({});
export type ListClubsToolInput = z.infer<typeof ListClubsToolInputSchema>;

/** `suggest_club_cards` arguments: cards proposed for a club deck's review queue (spec 7). */
export const SuggestClubCardsToolInputSchema = z.object({
  clubId: ClubIdArgument,
  deckId: DeckIdArgument.describe('The club deck the cards are for, as returned by list_clubs.'),
  cards: CardBatchArgument,
  idempotencyKey: IdempotencyKeySchema.optional(),
});
export type SuggestClubCardsToolInput = z.infer<typeof SuggestClubCardsToolInputSchema>;

/** Battle settings and their allowed values (spec 8). */
export const BATTLE_SETTINGS = {
  questionCounts: [5, 10, 15, 20],
  cardSelections: ['random', 'hardest', 'recent'],
  answerFormats: ['multiple_choice', 'type_in'],
  secondsPerQuestion: [10, 20, 30],
  joinPolicies: ['anyone_with_code', 'club_members'],
} as const;

/** `create_battle` arguments: a lobby from one deck with the spec 8 settings and defaults. */
export const CreateBattleToolInputSchema = z.object({
  deckId: DeckIdArgument,
  clubId: ClubIdArgument.optional().describe('Optional. The club hosting the battle.'),
  questionCount: z
    .literal(BATTLE_SETTINGS.questionCounts)
    .default(10)
    .describe('Number of questions: 5, 10, 15 or 20.'),
  cardSelection: z.enum(BATTLE_SETTINGS.cardSelections).default('random'),
  answerFormat: z.enum(BATTLE_SETTINGS.answerFormats).default('multiple_choice'),
  secondsPerQuestion: z
    .literal(BATTLE_SETTINGS.secondsPerQuestion)
    .default(20)
    .describe('Time per question in seconds: 10, 20 or 30.'),
  joinPolicy: z.enum(BATTLE_SETTINGS.joinPolicies).default('anyone_with_code'),
});
export type CreateBattleToolInput = z.infer<typeof CreateBattleToolInputSchema>;
