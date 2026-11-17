import type {
  CardType,
  CreateCardCommand,
  Provenance,
  UpdateCardCommand,
} from '@deck-club/contracts';

/** One thing to remember. Its content belongs to its deck; study state (Phase 1 next slice) belongs to each learner. */
export type Card = {
  id: string;
  deckId: string;
  type: CardType;
  front: string;
  back: string;
  extra: string;
  tags: string[];
  provenance: Provenance;
  /** Bumped on every content edit; study state survives edits (product spec 3). */
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

/** What is needed to create a card besides the validated command. */
export type NewCard = {
  id: string;
  deckId: string;
  command: CreateCardCommand;
  provenance: Provenance;
  now: Date;
};

/**
 * Creates a card at version 1.
 * @param input - the new id, deck, validated command, provenance and time
 * @returns the new card
 */
export function createCard(input: NewCard): Card {
  return {
    id: input.id,
    deckId: input.deckId,
    type: input.command.type,
    front: input.command.front,
    back: input.command.back,
    extra: input.command.extra,
    tags: input.command.tags,
    provenance: input.provenance,
    version: 1,
    createdAt: input.now,
    updatedAt: input.now,
    deletedAt: null,
  };
}

/**
 * Edits a card's content and bumps its version. Provenance keeps the original author.
 * @param card - the current card
 * @param patch - the fields to change
 * @param now - the time of the edit
 * @returns the edited card; the input is not mutated
 */
export function applyCardPatch(card: Card, patch: UpdateCardCommand, now: Date): Card {
  return {
    ...card,
    front: patch.front ?? card.front,
    back: patch.back ?? card.back,
    extra: patch.extra ?? card.extra,
    tags: patch.tags ?? card.tags,
    version: card.version + 1,
    updatedAt: now,
  };
}

/**
 * Soft-deletes a card; restorable for 30 days (product spec 3).
 * @param card - the card to delete
 * @param now - the time of deletion
 * @returns the deleted card
 */
export function softDeleteCard(card: Card, now: Date): Card {
  return { ...card, deletedAt: now, updatedAt: now };
}
