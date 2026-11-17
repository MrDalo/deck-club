import { Module } from '@nestjs/common';
import { STUDY_DEFAULTS } from '@deck-club/contracts';
import { CLOCK, randomIds, systemClock, TIME_AND_IDS } from '../../common/time-and-ids.js';
import { DecksModule } from '../decks/decks.module.js';
import { REVIEW_SCHEDULER } from './application/ports/review-scheduler.js';
import { STUDY_REPOSITORY } from './application/ports/study-repository.js';
import { ReviewService } from './application/review.service.js';
import { StudyQueueService } from './application/study-queue.service.js';
import { StudyStatsService } from './application/study-stats.service.js';
import { StudyController } from './http/study.controller.js';
import { TsFsrsScheduler } from './infrastructure/fsrs/ts-fsrs-scheduler.js';
import { DrizzleStudyRepository } from './infrastructure/drizzle/drizzle-study.repository.js';

/**
 * Spaced repetition: schedules, the review log, due cards and stats
 * (spec 6). Reads cards only through DecksFacade. Exports nothing yet; a
 * StudyFacade arrives when battles need to feed results into the schedule.
 */
@Module({
  imports: [DecksModule],
  controllers: [StudyController],
  providers: [
    StudyQueueService,
    ReviewService,
    StudyStatsService,
    { provide: STUDY_REPOSITORY, useClass: DrizzleStudyRepository },
    {
      provide: REVIEW_SCHEDULER,
      useFactory: () => TsFsrsScheduler.create(STUDY_DEFAULTS.desiredRetention),
    },
    { provide: CLOCK, useValue: systemClock },
    { provide: TIME_AND_IDS, useValue: { clock: systemClock, ids: randomIds } },
  ],
})
export class StudyModule {}
