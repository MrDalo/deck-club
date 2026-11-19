import { Module } from '@nestjs/common';
import { randomIds, systemClock, TIME_AND_IDS } from '../../common/time-and-ids.js';
import { DecksModule } from '../decks/decks.module.js';
import { ClubService } from './application/club.service.js';
import { CLUB_REPOSITORY } from './application/ports/club-repository.js';
import { INVITE_CODES } from './application/ports/invite-codes.js';
import { ClubsController } from './http/clubs.controller.js';
import { DrizzleClubRepository } from './infrastructure/drizzle/drizzle-club.repository.js';
import { randomInviteCodes } from './infrastructure/random-invite-codes.js';

/**
 * Clubs (spec 7): clubs, their members and roles, invite codes and the
 * decks they share. Reads decks only through DecksFacade. Exports nothing
 * yet; a ClubsFacade arrives when decks and study need membership (ADR 0010).
 */
@Module({
  imports: [DecksModule],
  controllers: [ClubsController],
  providers: [
    ClubService,
    { provide: CLUB_REPOSITORY, useClass: DrizzleClubRepository },
    { provide: TIME_AND_IDS, useValue: { clock: systemClock, ids: randomIds } },
    { provide: INVITE_CODES, useValue: randomInviteCodes },
  ],
})
export class ClubsModule {}
