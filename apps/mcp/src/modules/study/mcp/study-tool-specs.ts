import {
  FindWeakSpotsPromptArgsSchema,
  GetDueCardsToolInputSchema,
  GetStatsToolInputSchema,
  MCP_RESOURCE_URIS,
  QuizMePromptArgsSchema,
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
      'Get the next cards due for review, for one deck or all decks, in session order and within the user’s daily limits, with fronts and backs. Use it to quiz the user: ask one card at a time and never show the answer before the user replies.',
    inputSchema: GetDueCardsToolInputSchema,
    annotations: { readOnlyHint: true },
    widgetUri: WIDGET_URIS.studySession,
  },
  submitReview: {
    name: 'submit_review',
    title: 'Submit review',
    description:
      'Record how well the user remembered one card: "again" (forgot), "hard", "good" or "easy". Judge the user’s own answer fairly and explain mistakes; if the user says "mark that as again", do so. Returns when the card is due next.',
    inputSchema: SubmitReviewToolInputSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  },
  getStats: {
    name: 'get_stats',
    title: 'Get stats',
    description:
      'The user’s streak, today’s progress, 30-day retention and the cards they struggle with most. Use it when the user asks how they are doing or what to focus on.',
    inputSchema: GetStatsToolInputSchema,
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
