import { Inject, Injectable } from '@nestjs/common';
import {
  type DueCard,
  type DueCards,
  STUDY_DEFAULTS,
  type Today,
  type TodayDeck,
} from '@deck-club/contracts';
import { CLOCK, type Clock } from '../../../common/time-and-ids.js';
import { DecksFacade } from '../../decks/decks.facade.js';
import type { QueueEntry } from '../domain/session-queue.js';
import { streakDays } from '../domain/study-day.js';
import { orientCard, studyKeyOf } from '../domain/study-state.js';
import { REVIEW_SCHEDULER, type ReviewScheduler } from './ports/review-scheduler.js';
import { STUDY_REPOSITORY, type StudyRepository } from './ports/study-repository.js';
import { loadStudyContext } from './study-context.js';

/** How far back the Today streak looks; longer streaks still show, capped at this. */
const STREAK_LOOKBACK_DAYS = 366;

/** Reads of the study queue: due cards for a session, and the Today dashboard. */
@Injectable()
export class StudyQueueService {
  constructor(
    private readonly decks: DecksFacade,
    @Inject(STUDY_REPOSITORY) private readonly study: StudyRepository,
    @Inject(REVIEW_SCHEDULER) private readonly scheduler: ReviewScheduler,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** The next cards to study, in session order, each with its next-interval hints. */
  async getDueCards(userId: string, query: { deckId?: string; limit: number }): Promise<DueCards> {
    const now = this.clock.now();
    const { queue } = await loadStudyContext(
      { decks: this.decks, study: this.study },
      { userId, now, ...(query.deckId !== undefined && { deckId: query.deckId }) },
    );
    const cards = queue.slice(0, query.limit).map((entry) => this.toDueCard(entry, now));
    return { cards, totalDue: queue.length };
  }

  /** Due reviews and new cards per deck, today's review count and the streak (spec 4.4). */
  async getToday(userId: string): Promise<Today> {
    const now = this.clock.now();
    const { decks, queue, reviewsToday } = await loadStudyContext(
      { decks: this.decks, study: this.study },
      { userId, now },
    );
    const lookback = new Date(now.getTime() - STREAK_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
    const recentReviews = await this.study.listReviewsSince(userId, lookback);
    const perDeck: TodayDeck[] = decks.map(({ deckId, title }) => {
      const entries = queue.filter((entry) => entry.card.deckId === deckId);
      const newCards = entries.filter((entry) => entry.bucket === 'new').length;
      return { deckId, title, dueReviews: entries.length - newCards, newCards };
    });
    return {
      decks: perDeck,
      totals: {
        dueReviews: perDeck.reduce((total, deck) => total + deck.dueReviews, 0),
        newCards: perDeck.reduce((total, deck) => total + deck.newCards, 0),
      },
      reviewedToday: reviewsToday.length,
      streakDays: streakDays(
        recentReviews.map((review) => review.reviewedAt),
        now,
        STUDY_DEFAULTS.dayStartHour,
      ),
    };
  }

  private toDueCard(entry: QueueEntry, now: Date): DueCard {
    const memory = entry.memory ?? this.scheduler.initialMemory(now);
    const preview = this.scheduler.preview({
      memory,
      now,
      scheduleId: studyKeyOf({ cardId: entry.card.cardId, direction: entry.direction }),
    });
    const { prompt, answer } = orientCard(entry.card, entry.direction);
    return {
      deckId: entry.card.deckId,
      deckTitle: entry.card.deckTitle,
      cardId: entry.card.cardId,
      direction: entry.direction,
      cardType: entry.card.cardType,
      state: memory.state,
      prompt,
      answer,
      extra: entry.card.extra,
      nextDue: {
        again: preview.again.dueAt.toISOString(),
        hard: preview.hard.dueAt.toISOString(),
        good: preview.good.dueAt.toISOString(),
        easy: preview.easy.dueAt.toISOString(),
      },
    };
  }
}
