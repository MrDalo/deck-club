import { Inject, Injectable } from '@nestjs/common';
import { STUDY_DEFAULTS, type StudyStats } from '@deck-club/contracts';
import { CLOCK, type Clock } from '../../../common/time-and-ids.js';
import { retentionOf } from '../domain/retention.js';
import { streakDays, studyDayOf } from '../domain/study-day.js';
import { STUDY_REPOSITORY, type StudyRepository } from './ports/study-repository.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const RETENTION_WINDOW_DAYS = 30;
const STREAK_LOOKBACK_DAYS = 366;

/** Progress numbers for the stats tool and screen (spec 6, stats definitions). */
@Injectable()
export class StudyStatsService {
  constructor(
    @Inject(STUDY_REPOSITORY) private readonly study: StudyRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async getStats(userId: string): Promise<StudyStats> {
    const now = this.clock.now();
    const today = studyDayOf(now, STUDY_DEFAULTS.dayStartHour);
    const [recent, totalReviews] = await Promise.all([
      this.study.listReviewsSince(userId, new Date(now.getTime() - STREAK_LOOKBACK_DAYS * DAY_MS)),
      this.study.countReviews(userId),
    ]);
    const retentionWindowStart = now.getTime() - RETENTION_WINDOW_DAYS * DAY_MS;
    return {
      streakDays: streakDays(
        recent.map((review) => review.reviewedAt),
        now,
        STUDY_DEFAULTS.dayStartHour,
      ),
      reviewedToday: recent.filter((review) => review.reviewedAt >= today.start).length,
      totalReviews,
      retention30d: retentionOf(
        recent.filter((review) => review.reviewedAt.getTime() >= retentionWindowStart),
      ),
    };
  }
}
