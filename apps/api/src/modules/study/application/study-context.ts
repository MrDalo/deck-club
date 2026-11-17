import { STUDY_DEFAULTS } from '@deck-club/contracts';
import type { DecksFacade } from '../../decks/decks.facade.js';
import { buildSessionQueue, type QueueEntry } from '../domain/session-queue.js';
import { type StudyDay, studyDayOf } from '../domain/study-day.js';
import type { Review, StudyCard } from '../domain/study-state.js';
import type { StudyRepository } from './ports/study-repository.js';

/** What every study read needs: the queue for now and today's reviews. */
export type StudyContext = {
  /** The decks studied, in library order. */
  decks: { deckId: string; title: string }[];
  queue: QueueEntry[];
  reviewsToday: Review[];
  today: StudyDay;
  now: Date;
};

/** Collaborators the loader reads through. */
export type StudyContextSources = {
  decks: DecksFacade;
  study: StudyRepository;
};

/**
 * Loads the user's cards (through the decks facade), their schedules and
 * today's reviews, and builds the session queue.
 * @param sources - the decks facade and the study repository
 * @param request - the user, an optional deck, and the current time
 * @returns the queue and today's reviews
 * @throws AppError DECK_NOT_FOUND when `deckId` is not one of the user's decks
 */
export async function loadStudyContext(
  sources: StudyContextSources,
  request: { userId: string; deckId?: string; now: Date },
): Promise<StudyContext> {
  const { userId, deckId, now } = request;
  const today = studyDayOf(now, STUDY_DEFAULTS.dayStartHour);
  const decksWithCards = await sources.decks.listDecksWithCards(userId, deckId);
  const cards: StudyCard[] = decksWithCards.flatMap(({ deck, cards: deckCards }) =>
    deckCards.map((card) => ({
      deckId: deck.id,
      deckTitle: deck.title,
      cardId: card.id,
      cardType: card.type,
      front: card.front,
      back: card.back,
      extra: card.extra,
      createdAt: new Date(card.createdAt),
    })),
  );
  const [states, reviewsToday] = await Promise.all([
    sources.study.listStates(
      userId,
      cards.map((card) => card.cardId),
    ),
    sources.study.listReviewsSince(userId, today.start),
  ]);
  const queue = buildSessionQueue({
    cards,
    states,
    reviewsToday,
    now,
    today,
    limits: {
      newCardsPerDeck: STUDY_DEFAULTS.newCardsPerDeckPerDay,
      reviewsPerDeck: STUDY_DEFAULTS.reviewsPerDeckPerDay,
    },
  });
  const decks = decksWithCards.map(({ deck }) => ({ deckId: deck.id, title: deck.title }));
  return { decks, queue, reviewsToday, today, now };
}
