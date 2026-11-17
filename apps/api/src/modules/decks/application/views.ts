import type { Card as CardDto, Deck as DeckDto } from '@deck-club/contracts';
import type { Card } from '../domain/card.js';
import type { DeckWithCardCount } from './ports/deck-repository.js';

/**
 * Maps a domain deck to the contracts DTO (facades and controllers never return entities).
 * @param entry - the deck and its live card count
 * @returns the DTO
 */
export function toDeckDto(entry: DeckWithCardCount): DeckDto {
  const { deck, cardCount } = entry;
  return {
    id: deck.id,
    title: deck.title,
    description: deck.description,
    language: deck.language,
    tags: deck.tags,
    visibility: deck.visibility,
    cardCount,
    createdAt: deck.createdAt.toISOString(),
    updatedAt: deck.updatedAt.toISOString(),
  };
}

/**
 * Maps a domain card to the contracts DTO.
 * @param card - the card
 * @returns the DTO
 */
export function toCardDto(card: Card): CardDto {
  return {
    id: card.id,
    deckId: card.deckId,
    type: card.type,
    front: card.front,
    back: card.back,
    extra: card.extra,
    tags: card.tags,
    provenance: card.provenance,
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
  };
}
