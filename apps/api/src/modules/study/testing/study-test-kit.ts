import type { CreateCardCommand, Deck } from '@deck-club/contracts';
import { DecksFacade } from '../../decks/decks.facade.js';
import { createDecksTestKit } from '../../decks/testing/decks-test-kit.js';
import { ReviewService } from '../application/review.service.js';
import { StudyQueueService } from '../application/study-queue.service.js';
import { StudyStatsService } from '../application/study-stats.service.js';
import { TsFsrsScheduler } from '../infrastructure/fsrs/ts-fsrs-scheduler.js';
import { InMemoryStudyRepository } from '../infrastructure/memory/in-memory-study.repository.js';

const APP = { source: 'app', clientName: null } as const;

/**
 * The study services over in-memory decks and study stores, a real FSRS
 * scheduler (pure computation) and one advanceable clock shared by both
 * modules, so "tomorrow" means the same thing everywhere.
 */
export function createStudyTestKit(): ReturnType<typeof createDecksTestKit> & {
  study: InMemoryStudyRepository;
  queue: StudyQueueService;
  reviews: ReviewService;
  stats: StudyStatsService;
  /** Creates a deck owned by `userId` with the given cards. */
  seedDeck: (userId: string, cards: Partial<CreateCardCommand>[]) => Promise<Deck>;
} {
  const decksKit = createDecksTestKit();
  const facade = new DecksFacade(decksKit.deckService, decksKit.cardService);
  const study = new InMemoryStudyRepository();
  const scheduler = TsFsrsScheduler.create(0.9);
  let reviewIdCounter = 0;
  const reviewIds = {
    next: () => `00000000-0000-4000-9000-${String((reviewIdCounter += 1)).padStart(12, '0')}`,
  };

  const seedDeck = async (userId: string, cards: Partial<CreateCardCommand>[]): Promise<Deck> => {
    const deck = await decksKit.deckService.create(userId, {
      title: 'Spanish',
      description: '',
      language: 'es',
      tags: [],
    });
    for (const [index, card] of cards.entries()) {
      await decksKit.cardService.add({
        userId,
        deckId: deck.id,
        commands: [
          {
            type: 'basic',
            front: `front ${index}`,
            back: `back ${index}`,
            extra: '',
            tags: [],
            ...card,
          },
        ],
        provenance: APP,
      });
      decksKit.clock.advance(1000);
    }
    return deck;
  };

  return {
    ...decksKit,
    study,
    queue: new StudyQueueService(facade, study, scheduler, decksKit.clock),
    reviews: new ReviewService(facade, study, scheduler, { clock: decksKit.clock, ids: reviewIds }),
    stats: new StudyStatsService(study, decksKit.clock),
    seedDeck,
  };
}
