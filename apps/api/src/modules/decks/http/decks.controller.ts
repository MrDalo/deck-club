import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  CreateDeckInputSchema,
  type Deck,
  type DeckList,
  UpdateDeckInputSchema,
} from '@deck-club/contracts';
import type { AuthenticatedUser } from '../../../common/auth/access-token-verifier.js';
import { AuthGuard } from '../../../common/auth/auth.guard.js';
import { CurrentUser } from '../../../common/auth/current-user.decorator.js';
import { parseBody, parseId } from '../../../common/http/parse-input.js';
import { deckNotFound } from '../application/deck-access.js';
import { DeckService } from '../application/deck.service.js';

/** REST surface for decks. Parses input, calls one use case, returns its DTO. No rules here. */
@Controller('decks')
@UseGuards(AuthGuard)
export class DecksController {
  constructor(@Inject(DeckService) private readonly deckService: DeckService) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser): Promise<DeckList> {
    return { decks: await this.deckService.list(user.id) };
  }

  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown): Promise<Deck> {
    return this.deckService.create(user.id, parseBody(CreateDeckInputSchema, body));
  }

  @Get(':deckId')
  async get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('deckId') deckId: string,
  ): Promise<Deck> {
    return this.deckService.get(user.id, parseId(deckId, deckNotFound()));
  }

  @Patch(':deckId')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('deckId') deckId: string,
    @Body() body: unknown,
  ): Promise<Deck> {
    const id = parseId(deckId, deckNotFound());
    return this.deckService.update(user.id, id, parseBody(UpdateDeckInputSchema, body));
  }

  @Delete(':deckId')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('deckId') deckId: string,
  ): Promise<void> {
    await this.deckService.remove(user.id, parseId(deckId, deckNotFound()));
  }
}
