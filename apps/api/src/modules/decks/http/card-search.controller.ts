import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { type CardSearchResult, CardSearchQuerySchema } from '@deck-club/contracts';
import type { AuthenticatedUser } from '../../../common/auth/access-token-verifier.js';
import { AuthGuard } from '../../../common/auth/auth.guard.js';
import { CurrentUser } from '../../../common/auth/current-user.decorator.js';
import { parseBody } from '../../../common/http/parse-input.js';
import { CardSearchService } from '../application/card-search.service.js';

/** `GET /cards/search?q=…&deckId=…&limit=…`: the signed-in user's cards that match. */
@Controller('cards')
@UseGuards(AuthGuard)
export class CardSearchController {
  constructor(@Inject(CardSearchService) private readonly cardSearch: CardSearchService) {}

  @Get('search')
  async search(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: unknown,
  ): Promise<CardSearchResult> {
    return this.cardSearch.search(user.id, parseBody(CardSearchQuerySchema, query));
  }
}
