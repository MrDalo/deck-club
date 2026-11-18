import type { Clock, IdGenerator } from '../../../common/time-and-ids.js';
import { CardSearchService } from '../application/card-search.service.js';
import { CardService } from '../application/card.service.js';
import { DeckService } from '../application/deck.service.js';
import { InMemoryDeckStore } from '../infrastructure/memory/in-memory-repositories.js';

/** A clock tests can move forward. */
export class AdvanceableClock implements Clock {
  private current: Date;

  constructor(start = new Date('2026-11-17T10:00:00.000Z')) {
    this.current = start;
  }

  now(): Date {
    return this.current;
  }

  advance(milliseconds: number): void {
    this.current = new Date(this.current.getTime() + milliseconds);
  }
}

/** Deterministic, valid v4-shaped UUIDs: ...0001, ...0002. */
class SequentialIds implements IdGenerator {
  private counter = 0;

  next(): string {
    this.counter += 1;
    return `00000000-0000-4000-8000-${this.counter.toString().padStart(12, '0')}`;
  }
}

/** Both deck use-case services wired to one in-memory store. */
export function createDecksTestKit(): {
  store: InMemoryDeckStore;
  clock: AdvanceableClock;
  deckService: DeckService;
  cardService: CardService;
  cardSearchService: CardSearchService;
} {
  const store = new InMemoryDeckStore();
  const clock = new AdvanceableClock();
  const ids = new SequentialIds();
  return {
    store,
    clock,
    deckService: new DeckService(store.deckRepository, clock, ids),
    cardService: new CardService(store.deckRepository, store.cardRepository, clock, ids),
    cardSearchService: new CardSearchService(store.deckRepository, store.cardRepository),
  };
}
