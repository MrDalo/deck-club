import { Inject, Injectable } from '@nestjs/common';
import type {
  Card as CardDto,
  CreateCardCommand,
  Provenance,
  UpdateCardCommand,
} from '@deck-club/contracts';
import { CLOCK, type Clock, ID_GENERATOR, type IdGenerator } from '../../../common/time-and-ids.js';
import { applyCardPatch, type Card, createCard, softDeleteCard } from '../domain/card.js';
import { cardNotFound, loadManagedDeck } from './deck-access.js';
import { CARD_REPOSITORY, type CardRepository } from './ports/card-repository.js';
import { DECK_REPOSITORY, type DeckRepository } from './ports/deck-repository.js';
import { toCardDto } from './views.js';

/** What the caller asks for when adding cards. */
export type AddCardsRequest = {
  userId: string;
  deckId: string;
  commands: readonly CreateCardCommand[];
  provenance: Provenance;
};

/** Card use cases. Access always goes through the parent deck. */
@Injectable()
export class CardService {
  constructor(
    @Inject(DECK_REPOSITORY) private readonly decks: DeckRepository,
    @Inject(CARD_REPOSITORY) private readonly cards: CardRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_GENERATOR) private readonly ids: IdGenerator,
  ) {}

  async list(userId: string, deckId: string): Promise<CardDto[]> {
    await loadManagedDeck(this.decks, userId, deckId);
    const cards = await this.cards.listByDeck(deckId);
    return cards.map(toCardDto);
  }

  /** Adds one or many cards atomically, all stamped with the same provenance. */
  async add(request: AddCardsRequest): Promise<CardDto[]> {
    await loadManagedDeck(this.decks, request.userId, request.deckId);
    const now = this.clock.now();
    const cards = request.commands.map((command) =>
      createCard({
        id: this.ids.next(),
        deckId: request.deckId,
        command,
        provenance: request.provenance,
        now,
      }),
    );
    await this.cards.insertMany(cards);
    return cards.map(toCardDto);
  }

  async update(userId: string, ref: CardRef, patch: UpdateCardCommand): Promise<CardDto> {
    const card = await this.loadCard(userId, ref);
    const edited = applyCardPatch(card, patch, this.clock.now());
    await this.cards.update(edited);
    return toCardDto(edited);
  }

  async remove(userId: string, ref: CardRef): Promise<void> {
    const card = await this.loadCard(userId, ref);
    await this.cards.update(softDeleteCard(card, this.clock.now()));
  }

  private async loadCard(userId: string, ref: CardRef): Promise<Card> {
    await loadManagedDeck(this.decks, userId, ref.deckId);
    const card = await this.cards.findById(ref.deckId, ref.cardId);
    if (card === null) throw cardNotFound();
    return card;
  }
}

/** A card addressed through its deck. */
export type CardRef = {
  deckId: string;
  cardId: string;
};
