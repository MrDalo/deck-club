import type { Deck } from '@deck-club/contracts';
import { DecksFacade } from '../../decks/decks.facade.js';
import { createDecksTestKit } from '../../decks/testing/decks-test-kit.js';
import { ClubService } from '../application/club.service.js';
import type { InviteCodes } from '../application/ports/invite-codes.js';
import { InMemoryClubRepository } from '../infrastructure/memory/in-memory-club.repository.js';

/** Predictable invite codes: `CODE-0001`, `CODE-0002`… unless told otherwise. */
export class SequentialInviteCodes implements InviteCodes {
  private counter = 0;
  /** Codes to hand out first, e.g. to force a clash. */
  readonly queued: string[] = [];

  next(): string {
    const queued = this.queued.shift();
    if (queued !== undefined) return queued;
    this.counter += 1;
    return `CODE-${String(this.counter).padStart(4, '0')}`;
  }
}

/**
 * The club service over in-memory clubs and decks, with the decks kit's
 * advanceable clock and sequential ids shared by both modules.
 */
export function createClubsTestKit(): ReturnType<typeof createDecksTestKit> & {
  clubs: InMemoryClubRepository;
  inviteCodes: SequentialInviteCodes;
  clubService: ClubService;
  /** Creates a deck owned by `userId`, with `cards` cards. */
  seedDeck: (userId: string, title: string, cards?: number) => Promise<Deck>;
} {
  const decksKit = createDecksTestKit();
  const facade = new DecksFacade(decksKit.deckService, decksKit.cardService);
  const clubs = new InMemoryClubRepository();
  const inviteCodes = new SequentialInviteCodes();
  let idCounter = 0;
  const ids = {
    next: () => `00000000-0000-4000-a000-${String((idCounter += 1)).padStart(12, '0')}`,
  };
  const seedDeck = async (userId: string, title: string, cards = 0): Promise<Deck> => {
    const deck = await decksKit.deckService.create(userId, {
      title,
      description: '',
      language: 'es',
      tags: [],
    });
    if (cards > 0)
      await decksKit.cardService.add({
        userId,
        deckId: deck.id,
        commands: Array.from({ length: cards }, (_, index) => ({
          type: 'basic' as const,
          front: `front ${index}`,
          back: `back ${index}`,
          extra: '',
          tags: [],
        })),
        provenance: { source: 'app', clientName: null },
      });
    return deck;
  };
  return {
    ...decksKit,
    clubs,
    inviteCodes,
    clubService: new ClubService(clubs, facade, { clock: decksKit.clock, ids }, inviteCodes),
    seedDeck,
  };
}
