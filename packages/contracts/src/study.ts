import { z } from 'zod';
import { CardTypeSchema } from './card.js';
import { IdSchema, TimestampSchema } from './text.js';

/** The four ratings of a review (spec 6), in keyboard order 1–4. */
export const RATINGS = ['again', 'hard', 'good', 'easy'] as const;
export const RatingSchema = z.enum(RATINGS);
export type Rating = z.infer<typeof RatingSchema>;

/** FSRS card states (spec 3, 6). */
export const STUDY_STATES = ['new', 'learning', 'review', 'relearning'] as const;
export const StudyStateNameSchema = z.enum(STUDY_STATES);
export type StudyStateName = z.infer<typeof StudyStateNameSchema>;

/**
 * Which side is asked. A basic card is only studied `forward` (front → back);
 * a reversible card also `reverse` (back → front), each with its own schedule.
 */
export const STUDY_DIRECTIONS = ['forward', 'reverse'] as const;
export const StudyDirectionSchema = z.enum(STUDY_DIRECTIONS);
export type StudyDirection = z.infer<typeof StudyDirectionSchema>;

/** Where a review came from (spec 6, review sources). */
export const REVIEW_SOURCES = ['app', 'mcp', 'battle'] as const;
export const ReviewSourceSchema = z.enum(REVIEW_SOURCES);
export type ReviewSource = z.infer<typeof ReviewSourceSchema>;

/** Daily limits and scheduling defaults (spec 6). Per-user settings arrive with the profile slice. */
export const STUDY_DEFAULTS = {
  newCardsPerDeckPerDay: 20,
  reviewsPerDeckPerDay: 200,
  desiredRetention: 0.9,
  /** Hour (UTC until profiles carry a time zone) at which a new study day starts. */
  dayStartHour: 4,
  /** Most cards one due-cards request returns. */
  maxDueCardsPerRequest: 50,
} as const;

/** When the card comes back for each rating, shown on the rating buttons before the user picks. */
export const NextDueByRatingSchema = z.object({
  again: TimestampSchema,
  hard: TimestampSchema,
  good: TimestampSchema,
  easy: TimestampSchema,
});
export type NextDueByRating = z.infer<typeof NextDueByRatingSchema>;

/** One card to study now, already oriented: `prompt` is what to ask, `answer` what to reveal. */
export const DueCardSchema = z.object({
  deckId: IdSchema,
  deckTitle: z.string(),
  cardId: IdSchema,
  direction: StudyDirectionSchema,
  cardType: CardTypeSchema,
  state: StudyStateNameSchema,
  prompt: z.string(),
  answer: z.string(),
  extra: z.string(),
  nextDue: NextDueByRatingSchema,
});
export type DueCard = z.infer<typeof DueCardSchema>;

/** Response of `GET /study/due`: the next cards in session order (spec 6). */
export const DueCardsSchema = z.object({
  cards: z.array(DueCardSchema),
  /** How many cards are due in total right now, beyond this page. */
  totalDue: z.number().int().nonnegative(),
});
export type DueCards = z.infer<typeof DueCardsSchema>;

/** Query of `GET /study/due`. */
export const DueCardsQuerySchema = z.object({
  deckId: IdSchema.optional(),
  limit: z.coerce.number().int().min(1).max(STUDY_DEFAULTS.maxDueCardsPerRequest).default(20),
});
export type DueCardsQuery = z.input<typeof DueCardsQuerySchema>;

/** Body of `POST /study/reviews` and the `submit_review` MCP tool. */
export const SubmitReviewInputSchema = z.object({
  deckId: IdSchema,
  cardId: IdSchema,
  direction: StudyDirectionSchema.default('forward'),
  rating: RatingSchema,
  /** Time the user took to answer, in milliseconds (optional; capped at one hour). */
  durationMs: z.number().int().min(0).max(3_600_000).optional(),
});
export type SubmitReviewInput = z.input<typeof SubmitReviewInputSchema>;
export type SubmitReviewCommand = z.output<typeof SubmitReviewInputSchema>;

/** Response of a submitted review. */
export const ReviewResultSchema = z.object({
  reviewId: IdSchema,
  cardId: IdSchema,
  direction: StudyDirectionSchema,
  rating: RatingSchema,
  state: StudyStateNameSchema,
  nextDueAt: TimestampSchema,
});
export type ReviewResult = z.infer<typeof ReviewResultSchema>;

/** Response of `POST /study/reviews/undo`: the card whose last rating was taken back. */
export const UndoResultSchema = z.object({
  reviewId: IdSchema,
  deckId: IdSchema,
  cardId: IdSchema,
  direction: StudyDirectionSchema,
});
export type UndoResult = z.infer<typeof UndoResultSchema>;

/** One deck's line on the Today dashboard. */
export const TodayDeckSchema = z.object({
  deckId: IdSchema,
  title: z.string(),
  dueReviews: z.number().int().nonnegative(),
  newCards: z.number().int().nonnegative(),
});
export type TodayDeck = z.infer<typeof TodayDeckSchema>;

/** Response of `GET /study/today` (spec 4.4, 5: Today dashboard). */
export const TodaySchema = z.object({
  decks: z.array(TodayDeckSchema),
  totals: z.object({
    dueReviews: z.number().int().nonnegative(),
    newCards: z.number().int().nonnegative(),
  }),
  reviewedToday: z.number().int().nonnegative(),
  streakDays: z.number().int().nonnegative(),
});
export type Today = z.infer<typeof TodaySchema>;

/** Response of `GET /study/stats` and the `get_stats` MCP tool (spec 6, stats definitions). */
export const StudyStatsSchema = z.object({
  streakDays: z.number().int().nonnegative(),
  reviewedToday: z.number().int().nonnegative(),
  totalReviews: z.number().int().nonnegative(),
  /** Share of review-state cards rated Hard, Good or Easy in the last 30 days; null with no such reviews. */
  retention30d: z.number().min(0).max(1).nullable(),
});
export type StudyStats = z.infer<typeof StudyStatsSchema>;
