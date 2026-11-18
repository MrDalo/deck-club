import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  AddCardsInputSchema,
  type Card,
  type CardList,
  CreateCardInputSchema,
  UpdateCardInputSchema,
} from '@deck-club/contracts';
import type { AuthenticatedUser } from '../../../common/auth/access-token-verifier.js';
import { AuthGuard } from '../../../common/auth/auth.guard.js';
import { CurrentUser } from '../../../common/auth/current-user.decorator.js';
import { Idempotent } from '../../../common/idempotency/idempotency.interceptor.js';
import { AppError } from '../../../common/errors/app-error.js';
import { parseBody, parseId } from '../../../common/http/parse-input.js';
import { provenanceFromHeaders } from '../../../common/http/provenance.js';
import { CardService, type CardRef } from '../application/card.service.js';
import { cardNotFound, deckNotFound } from '../application/deck-access.js';

type RequestHeaders = Record<string, string | string[] | undefined>;

const parseCardRef = (deckId: string, cardId: string): CardRef => ({
  deckId: parseId(deckId, deckNotFound()),
  cardId: parseId(cardId, cardNotFound()),
});

/** REST surface for the cards of one deck. */
@Controller('decks/:deckId/cards')
@UseGuards(AuthGuard)
export class CardsController {
  constructor(@Inject(CardService) private readonly cardService: CardService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('deckId') deckId: string,
  ): Promise<CardList> {
    return { cards: await this.cardService.list(user.id, parseId(deckId, deckNotFound())) };
  }

  @Post()
  @Idempotent()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('deckId') deckId: string,
    @Body() body: unknown,
    @Headers() headers: RequestHeaders,
  ): Promise<Card> {
    const [card] = await this.cardService.add({
      userId: user.id,
      deckId: parseId(deckId, deckNotFound()),
      commands: [parseBody(CreateCardInputSchema, body)],
      provenance: provenanceFromHeaders(headers),
    });
    if (card === undefined) throw new AppError('INTERNAL', 'The card could not be created.');
    return card;
  }

  /** Up to 100 cards in one atomic call; what the `add_cards` MCP tool uses. */
  @Post('batch')
  @Idempotent()
  async createMany(
    @CurrentUser() user: AuthenticatedUser,
    @Param('deckId') deckId: string,
    @Body() body: unknown,
    @Headers() headers: RequestHeaders,
  ): Promise<CardList> {
    const cards = await this.cardService.add({
      userId: user.id,
      deckId: parseId(deckId, deckNotFound()),
      commands: parseBody(AddCardsInputSchema, body).cards,
      provenance: provenanceFromHeaders(headers),
    });
    return { cards };
  }

  @Patch(':cardId')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('deckId') deckId: string,
    @Param('cardId') cardId: string,
    @Body() body: unknown,
  ): Promise<Card> {
    return this.cardService.update(
      user.id,
      parseCardRef(deckId, cardId),
      parseBody(UpdateCardInputSchema, body),
    );
  }

  @Delete(':cardId')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('deckId') deckId: string,
    @Param('cardId') cardId: string,
  ): Promise<void> {
    await this.cardService.remove(user.id, parseCardRef(deckId, cardId));
  }
}
