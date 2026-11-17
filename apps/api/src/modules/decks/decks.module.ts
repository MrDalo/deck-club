import { Module } from '@nestjs/common';
import { CLOCK, ID_GENERATOR, randomIds, systemClock } from '../../common/time-and-ids.js';
import { CardService } from './application/card.service.js';
import { DeckService } from './application/deck.service.js';
import { CARD_REPOSITORY } from './application/ports/card-repository.js';
import { DECK_REPOSITORY } from './application/ports/deck-repository.js';
import { DecksFacade } from './decks.facade.js';
import { CardsController } from './http/cards.controller.js';
import { DecksController } from './http/decks.controller.js';
import { DrizzleCardRepository } from './infrastructure/drizzle/drizzle-card.repository.js';
import { DrizzleDeckRepository } from './infrastructure/drizzle/drizzle-deck.repository.js';

/** Decks and cards: the library bounded context. Exports only its facade. */
@Module({
  controllers: [DecksController, CardsController],
  providers: [
    DeckService,
    CardService,
    DecksFacade,
    { provide: DECK_REPOSITORY, useClass: DrizzleDeckRepository },
    { provide: CARD_REPOSITORY, useClass: DrizzleCardRepository },
    { provide: CLOCK, useValue: systemClock },
    { provide: ID_GENERATOR, useValue: randomIds },
  ],
  exports: [DecksFacade],
})
export class DecksModule {}
