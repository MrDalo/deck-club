import { AppError } from '../../../common/errors/app-error.js';
import { canManageDeck } from '../domain/deck.js';
import type { DeckRepository, DeckWithCardCount } from './ports/deck-repository.js';

/** The error for a deck that is missing, deleted or someone else's: all three look the same. */
export function deckNotFound(): AppError {
  return new AppError('DECK_NOT_FOUND', 'No deck with that id exists in your library.');
}

/** The error for a card that is missing or deleted. */
export function cardNotFound(): AppError {
  return new AppError('CARD_NOT_FOUND', 'No card with that id exists in this deck.');
}

/**
 * Loads a deck the user may manage.
 * @param decks - the deck repository
 * @param userId - the signed-in user
 * @param deckId - the requested deck
 * @returns the deck and its card count
 * @throws AppError DECK_NOT_FOUND when it does not exist or belongs to someone else
 */
export async function loadManagedDeck(
  decks: DeckRepository,
  userId: string,
  deckId: string,
): Promise<DeckWithCardCount> {
  const entry = await decks.findById(deckId);
  if (entry === null || !canManageDeck(entry.deck, userId)) throw deckNotFound();
  return entry;
}
