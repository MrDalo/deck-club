import { Inject, Injectable } from '@nestjs/common';
import type { CreateDeckCommand, Deck as DeckDto, UpdateDeckCommand } from '@deck-club/contracts';
import { CLOCK, type Clock, ID_GENERATOR, type IdGenerator } from '../../../common/time-and-ids.js';
import { applyDeckPatch, createDeck, softDeleteDeck } from '../domain/deck.js';
import { loadManagedDeck } from './deck-access.js';
import { DECK_REPOSITORY, type DeckRepository } from './ports/deck-repository.js';
import { toDeckDto } from './views.js';

/** Deck use cases. Every one has the shape: load → check access → domain → persist → DTO. */
@Injectable()
export class DeckService {
  constructor(
    @Inject(DECK_REPOSITORY) private readonly decks: DeckRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_GENERATOR) private readonly ids: IdGenerator,
  ) {}

  async list(userId: string): Promise<DeckDto[]> {
    const entries = await this.decks.listByOwner(userId);
    return entries.map(toDeckDto);
  }

  async get(userId: string, deckId: string): Promise<DeckDto> {
    return toDeckDto(await loadManagedDeck(this.decks, userId, deckId));
  }

  /**
   * Live decks by id, whoever owns them. Only for a caller that has already
   * decided the reader may see them (a club showing its shared decks to its
   * members); never behind a route of its own.
   * @param deckIds - the decks to read
   * @returns the live ones, in no particular order
   */
  async findMany(deckIds: readonly string[]): Promise<DeckDto[]> {
    const entries = await this.decks.listByIds(deckIds);
    return entries.map(toDeckDto);
  }

  async create(userId: string, command: CreateDeckCommand): Promise<DeckDto> {
    const deck = createDeck({
      id: this.ids.next(),
      ownerId: userId,
      command,
      now: this.clock.now(),
    });
    await this.decks.insert(deck);
    return toDeckDto({ deck, cardCount: 0 });
  }

  async update(userId: string, deckId: string, patch: UpdateDeckCommand): Promise<DeckDto> {
    const entry = await loadManagedDeck(this.decks, userId, deckId);
    const deck = applyDeckPatch(entry.deck, patch, this.clock.now());
    await this.decks.update(deck);
    return toDeckDto({ deck, cardCount: entry.cardCount });
  }

  async remove(userId: string, deckId: string): Promise<void> {
    const entry = await loadManagedDeck(this.decks, userId, deckId);
    await this.decks.update(softDeleteDeck(entry.deck, this.clock.now()));
  }
}
