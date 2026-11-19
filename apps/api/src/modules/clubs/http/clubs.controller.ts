import { Body, Controller, Get, HttpCode, Inject, Param, Post, UseGuards } from '@nestjs/common';
import {
  type Club,
  type ClubList,
  CreateClubInputSchema,
  JoinClubInputSchema,
  ShareClubDeckInputSchema,
} from '@deck-club/contracts';
import type { AuthenticatedUser } from '../../../common/auth/access-token-verifier.js';
import { AuthGuard } from '../../../common/auth/auth.guard.js';
import { CurrentUser } from '../../../common/auth/current-user.decorator.js';
import { Idempotent } from '../../../common/idempotency/idempotency.interceptor.js';
import { parseBody, parseId } from '../../../common/http/parse-input.js';
import { clubNotFound } from '../application/club-access.js';
import { ClubService } from '../application/club.service.js';

/** REST surface for clubs. Parses input, calls one use case, returns its DTO. No rules here. */
@Controller('clubs')
@UseGuards(AuthGuard)
export class ClubsController {
  constructor(@Inject(ClubService) private readonly clubService: ClubService) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser): Promise<ClubList> {
    return { clubs: await this.clubService.list(user.id) };
  }

  @Post()
  @Idempotent()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown): Promise<Club> {
    return this.clubService.create(user.id, parseBody(CreateClubInputSchema, body));
  }

  @Post('join')
  @HttpCode(200)
  async join(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown): Promise<Club> {
    return this.clubService.join(user.id, parseBody(JoinClubInputSchema, body));
  }

  @Post(':clubId/decks')
  @HttpCode(200)
  async shareDeck(
    @CurrentUser() user: AuthenticatedUser,
    @Param('clubId') clubId: string,
    @Body() body: unknown,
  ): Promise<Club> {
    return this.clubService.shareDeck(
      user.id,
      parseId(clubId, clubNotFound()),
      parseBody(ShareClubDeckInputSchema, body),
    );
  }
}
