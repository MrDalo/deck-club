import type {
  FindWeakSpotsPromptArgs,
  GetDueCardsToolInput,
  GetStatsToolInput,
  QuizMePromptArgs,
  SubmitReviewToolInput,
} from '@deck-club/contracts';
import { Injectable } from '@nestjs/common';
import { notImplemented } from '../../../common/errors/deck-club-error.js';
import type { PromptMessageText, ResourceBody } from '../../../common/mcp/content-registration.js';
import type { McpCaller } from '../../../common/mcp/mcp-caller.js';
import type { ToolReply } from '../../../common/mcp/tool-registration.js';

/**
 * Use cases behind studying in chat (spec 4.5, 6, 9): due cards, reviews,
 * stats, and the "Quiz me" and "Find my weak spots" prompts.
 *
 * The interface is complete; the bodies are not built yet and refuse with
 * NOT_IMPLEMENTED. They will call the API's `/study` endpoints, so a review
 * from chat goes through the same FSRS engine and daily limits as the app.
 */
@Injectable()
export class StudyService {
  /** `get_due_cards`: the next due cards in session order, within daily limits. */
  getDueCards(_caller: McpCaller, _input: GetDueCardsToolInput): Promise<ToolReply> {
    return notImplemented('get_due_cards');
  }

  /** `submit_review`: records one rating and returns the next due date. */
  submitReview(_caller: McpCaller, _input: SubmitReviewToolInput): Promise<ToolReply> {
    return notImplemented('submit_review');
  }

  /** `get_stats`: streak, today's progress, retention and weak cards. */
  getStats(_caller: McpCaller, _input: GetStatsToolInput): Promise<ToolReply> {
    return notImplemented('get_stats');
  }

  /** Resource `deck-club://study/today`: today's due and new counts per deck. */
  readToday(_caller: McpCaller): Promise<ResourceBody> {
    return notImplemented('The today resource');
  }

  /** Prompt `quiz_me`: a due-card session run in chat. */
  quizMePrompt(_args: QuizMePromptArgs): Promise<PromptMessageText[]> {
    return notImplemented('The "Quiz me" prompt');
  }

  /** Prompt `find_weak_spots`: what the user keeps forgetting, and better cards. */
  findWeakSpotsPrompt(_args: FindWeakSpotsPromptArgs): Promise<PromptMessageText[]> {
    return notImplemented('The "Find my weak spots" prompt');
  }
}
