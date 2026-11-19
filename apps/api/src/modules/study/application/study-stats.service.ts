import { Inject, Injectable } from '@nestjs/common';
import {
  type Card,
  STUDY_DEFAULTS,
  type StudyStats,
  WEAK_CARD_RULE,
  type WeakCard,
} from '@deck-club/contracts';
import { CLOCK, type Clock } from '../../../common/time-and-ids.js';
import { DecksFacade } from '../../decks/decks.facade.js';
import { retentionOf } from '../domain/retention.js';
import { streakDays, studyDayOf } from '../domain/study-day.js';
import { orientCard } from '../domain/study-state.js';
import { type ForgottenSide, forgottenSides } from '../domain/weak-cards.js';
import { STUDY_REPOSITORY, type StudyRepository } from './ports/study-repository.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const RETENTION_WINDOW_DAYS = 30;
const STREAK_LOOKBACK_DAYS = 366;

/** A card the user can still see, with its deck's title. */
type LiveCard = { card: Card; deckTitle: string };

/** Progress numbers for the stats tool and screen (spec 6, stats definitions). */
@Injectable()
export class StudyStatsService {
  constructor(
    @Inject(DecksFacade) private readonly decks: DecksFacade,
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
    const weakSince = new Date(now.getTime() - WEAK_CARD_RULE.windowDays * DAY_MS);
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
      weakCards: await this.weakCards(userId, forgottenSides(recent, weakSince)),
    };
  }

  /**
   * Looks up the content of the weak sides through the decks facade and
   * keeps the first that still exist: a deleted card (or a deck the user no
   * longer has) is skipped, never shown from the review log.
   */
  private async weakCards(userId: string, sides: readonly ForgottenSide[]): Promise<WeakCard[]> {
    if (sides.length === 0) return [];
    const live = new Map<string, LiveCard>();
    for (const { deck, cards } of await this.decks.listDecksWithCards(userId))
      for (const card of cards) live.set(card.id, { card, deckTitle: deck.title });
    return sides
      .flatMap((side) => {
        const found = live.get(side.cardId);
        if (found === undefined) return [];
        const { prompt, answer } = orientCard(found.card, side.direction);
        return [
          {
            deckId: found.card.deckId,
            deckTitle: found.deckTitle,
            cardId: side.cardId,
            direction: side.direction,
            cardType: found.card.type,
            prompt,
            answer,
            extra: found.card.extra,
            forgotten: side.forgotten,
            lastForgottenAt: side.lastForgottenAt.toISOString(),
          },
        ];
      })
      .slice(0, WEAK_CARD_RULE.shown);
  }
}
