import {
  FindWeakSpotsPromptArgsSchema,
  GetDueCardsOutputSchema,
  GetDueCardsToolInputSchema,
  GetStatsOutputSchema,
  GetStatsToolInputSchema,
  MCP_RESOURCE_URIS,
  QuizMePromptArgsSchema,
  SubmitReviewOutputSchema,
  SubmitReviewToolInputSchema,
} from '@deck-club/contracts';
import type { StandardSchemaWithJSON } from '@modelcontextprotocol/server';
import type { PromptSpec, ResourceSpec } from '../../../common/mcp/content-registration.js';
import type { ToolSpec } from '../../../common/mcp/tool-registration.js';
import { WIDGET_URIS } from '../../../common/mcp/widgets.js';

/** The study tools as the AI sees them (spec 9; descriptions written for the AI). */
export const STUDY_TOOLS = {
  getDueCards: {
    name: 'get_due_cards',
    title: 'Get due cards',
    description:
      'Get the next cards due for review, for one deck or all decks, in session order and within the user’s daily limits, with what to ask and the answer. Use it to quiz the user: ask one card at a time and never show the answer before the user replies. Each card gives the deck id, card id and direction to pass to submit_review. The user sees the cards in a study view with the answers hidden.',
    inputSchema: GetDueCardsToolInputSchema,
    outputSchema: GetDueCardsOutputSchema,
    annotations: { readOnlyHint: true },
    widgetUri: WIDGET_URIS.studySession,
  },
  submitReview: {
    name: 'submit_review',
    title: 'Submit review',
    description:
      'Record how well the user remembered one card from get_due_cards: "again" (forgot), "hard", "good" or "easy". Call it once per card, after the user answered: judge their own words fairly and explain mistakes; if the user says "mark that as again", do so. Pass the deck id, card id and direction get_due_cards gave, and a new idempotencyKey (e.g. a UUID) every time, reused only to retry the same call: a second call without it rates the card twice. Returns when the card comes back. Cards the user rated in the study view are already recorded.',
    inputSchema: SubmitReviewToolInputSchema,
    outputSchema: SubmitReviewOutputSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  },
  getStats: {
    name: 'get_stats',
    title: 'Get stats',
    description:
      'The user’s streak, today’s progress (reviews done, cards still due per deck), 30-day retention and the cards they keep forgetting (forgotten at least twice in 30 days), with the ids to act on them. Use it when the user asks how they are doing or what to focus on. Encourage, never scold; offer a quiz with get_due_cards, and suggest clearer cards with update_card only after the user agrees.',
    inputSchema: GetStatsToolInputSchema,
    outputSchema: GetStatsOutputSchema,
    annotations: { readOnlyHint: true },
    widgetUri: WIDGET_URIS.stats,
  },
} as const satisfies Record<string, ToolSpec<StandardSchemaWithJSON>>;

/** Today's workload as attachable context. */
export const TODAY_RESOURCE = {
  name: 'today',
  uri: MCP_RESOURCE_URIS.today,
  title: 'Today',
  description: 'Today’s due reviews and new cards, per deck and in total, and the current streak.',
  mimeType: 'application/json',
} as const satisfies ResourceSpec;

/** "Quiz me" and "Find my weak spots" (spec 9, prompts). */
export const STUDY_PROMPTS = {
  quizMe: {
    name: 'quiz_me',
    title: 'Quiz me',
    description:
      'Review your due cards in chat: one question at a time, fair judging of your own words, every answer recorded.',
    argsSchema: QuizMePromptArgsSchema,
  },
  findWeakSpots: {
    name: 'find_weak_spots',
    title: 'Find my weak spots',
    description:
      'Look at your stats and review history, explain what you keep forgetting and suggest better cards.',
    argsSchema: FindWeakSpotsPromptArgsSchema,
  },
} as const satisfies Record<string, PromptSpec<StandardSchemaWithJSON>>;
