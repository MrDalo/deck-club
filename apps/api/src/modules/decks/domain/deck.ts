import type { CreateDeckCommand, DeckVisibility, UpdateDeckCommand } from '@deck-club/contracts';

/** A named collection of cards owned by one user (clubs own decks from Phase 2). */
export type Deck = {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  language: string;
  tags: string[];
  visibility: DeckVisibility;
  createdAt: Date;
  updatedAt: Date;
  /** Set by a soft delete; the deck is restorable for 30 days (product spec 3). */
  deletedAt: Date | null;
};

/** What is needed to create a deck besides the validated command. */
export type NewDeck = {
  id: string;
  ownerId: string;
  command: CreateDeckCommand;
  now: Date;
};

/**
 * Creates a deck. Decks are private until the owner shares them (product spec 10).
 * @param input - the new id, owner, validated command and creation time
 * @returns the new deck
 */
export function createDeck(input: NewDeck): Deck {
  return {
    id: input.id,
    ownerId: input.ownerId,
    title: input.command.title,
    description: input.command.description,
    language: input.command.language,
    tags: input.command.tags,
    visibility: 'private',
    createdAt: input.now,
    updatedAt: input.now,
    deletedAt: null,
  };
}

/**
 * Applies a validated patch to a deck.
 * @param deck - the current deck
 * @param patch - the fields to change
 * @param now - the time of the edit
 * @returns the edited deck; the input is not mutated
 */
export function applyDeckPatch(deck: Deck, patch: UpdateDeckCommand, now: Date): Deck {
  return {
    ...deck,
    title: patch.title ?? deck.title,
    description: patch.description ?? deck.description,
    language: patch.language ?? deck.language,
    tags: patch.tags ?? deck.tags,
    visibility: patch.visibility ?? deck.visibility,
    updatedAt: now,
  };
}

/**
 * Soft-deletes a deck so a mistake, human or AI, can be undone (product spec 3).
 * @param deck - the deck to delete
 * @param now - the time of deletion
 * @returns the deleted deck
 */
export function softDeleteDeck(deck: Deck, now: Date): Deck {
  return { ...deck, deletedAt: now, updatedAt: now };
}

/**
 * Whether a user may read and change a deck. Phase 1: only its owner.
 * @param deck - the deck
 * @param userId - the signed-in user
 * @returns true when the user owns the deck and it is not deleted
 */
export function canManageDeck(deck: Deck, userId: string): boolean {
  return deck.ownerId === userId && deck.deletedAt === null;
}
