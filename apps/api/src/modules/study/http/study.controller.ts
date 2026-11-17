import { Body, Controller, Get, Headers, HttpCode, Post, Query, UseGuards } from '@nestjs/common';
import {
  type DueCards,
  DueCardsQuerySchema,
  type ReviewResult,
  type StudyStats,
  SubmitReviewInputSchema,
  type Today,
  type UndoResult,
} from '@deck-club/contracts';
import type { AuthenticatedUser } from '../../../common/auth/access-token-verifier.js';
import { AuthGuard } from '../../../common/auth/auth.guard.js';
import { CurrentUser } from '../../../common/auth/current-user.decorator.js';
import { parseBody } from '../../../common/http/parse-input.js';
import { provenanceFromHeaders } from '../../../common/http/provenance.js';
import { ReviewService } from '../application/review.service.js';
import { StudyQueueService } from '../application/study-queue.service.js';
import { StudyStatsService } from '../application/study-stats.service.js';

type RequestHeaders = Record<string, string | string[] | undefined>;

/** REST surface for studying: Today, due cards, reviews, undo and stats. */
@Controller('study')
@UseGuards(AuthGuard)
export class StudyController {
  constructor(
    private readonly queue: StudyQueueService,
    private readonly reviews: ReviewService,
    private readonly stats: StudyStatsService,
  ) {}

  @Get('today')
  async today(@CurrentUser() user: AuthenticatedUser): Promise<Today> {
    return this.queue.getToday(user.id);
  }

  @Get('due')
  async due(@CurrentUser() user: AuthenticatedUser, @Query() query: unknown): Promise<DueCards> {
    const { deckId, limit } = parseBody(DueCardsQuerySchema, query);
    return this.queue.getDueCards(user.id, { limit, ...(deckId !== undefined && { deckId }) });
  }

  @Post('reviews')
  async submit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
    @Headers() headers: RequestHeaders,
  ): Promise<ReviewResult> {
    return this.reviews.submit({
      userId: user.id,
      command: parseBody(SubmitReviewInputSchema, body),
      provenance: provenanceFromHeaders(headers),
    });
  }

  @Post('reviews/undo')
  @HttpCode(200)
  async undo(@CurrentUser() user: AuthenticatedUser): Promise<UndoResult> {
    return this.reviews.undoLast(user.id);
  }

  @Get('stats')
  async getStats(@CurrentUser() user: AuthenticatedUser): Promise<StudyStats> {
    return this.stats.getStats(user.id);
  }
}
