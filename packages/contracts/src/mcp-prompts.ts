import { z } from 'zod';
import { DECK_LIMITS } from './deck.js';

/**
 * Ready-made prompts the user can pick in their assistant (product spec 9,
 * "Prompts"). Additive forever, like tool names.
 */
export const MCP_PROMPT_NAMES = ['make_cards', 'quiz_me', 'find_weak_spots'] as const;
export type McpPromptName = (typeof MCP_PROMPT_NAMES)[number];

/** Longest source text the "Make cards from this" prompt accepts (roughly a long article). */
export const PROMPT_SOURCE_MAX_LENGTH = 50_000;

/** MCP prompt arguments are always strings, so counts arrive as digits. */
const CountArgument = z
  .string()
  .trim()
  .regex(/^\d{1,3}$/, 'Use a whole number such as 20.');

const DeckNameArgument = z
  .string()
  .trim()
  .min(DECK_LIMITS.title.min)
  .max(DECK_LIMITS.title.max)
  .describe('Optional. The deck, by its name.');

/** "Make cards from this": turn pasted text, notes or a link into well-formed cards. */
export const MakeCardsPromptArgsSchema = z.object({
  source: z
    .string()
    .trim()
    .min(1)
    .max(PROMPT_SOURCE_MAX_LENGTH)
    .describe('The text, notes or link to turn into flashcards.'),
  deck: DeckNameArgument.optional(),
  count: CountArgument.optional().describe('Optional. How many cards to aim for, e.g. 20.'),
});
export type MakeCardsPromptArgs = z.infer<typeof MakeCardsPromptArgsSchema>;

/** "Quiz me": run a due-card session in chat. */
export const QuizMePromptArgsSchema = z.object({
  deck: DeckNameArgument.optional(),
  count: CountArgument.optional().describe('Optional. How many cards to review, e.g. 10.'),
});
export type QuizMePromptArgs = z.infer<typeof QuizMePromptArgsSchema>;

/** "Find my weak spots": explain what the user keeps forgetting and suggest better cards. */
export const FindWeakSpotsPromptArgsSchema = z.object({
  deck: DeckNameArgument.optional(),
});
export type FindWeakSpotsPromptArgs = z.infer<typeof FindWeakSpotsPromptArgsSchema>;
