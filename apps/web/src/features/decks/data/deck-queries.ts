import {
  CardListSchema,
  DeckListSchema,
  DeckSchema,
  type Card,
  type Deck,
} from '@deck-club/contracts';
import { queryOptions } from '@tanstack/react-query';
import { apiRequest } from '@/shared/api/api-client';
import { queryKeys } from '@/shared/api/query-keys';

/** The signed-in user's decks, most recently changed first. */
export const deckListQuery = () =>
  queryOptions<Deck[]>({
    queryKey: queryKeys.decks(),
    queryFn: async () => (await apiRequest('/decks', DeckListSchema)).decks,
  });

/** One deck by id. */
export const deckQuery = (deckId: string) =>
  queryOptions<Deck>({
    queryKey: queryKeys.deck(deckId),
    queryFn: () => apiRequest(`/decks/${deckId}`, DeckSchema),
  });

/** The live cards of one deck, oldest first. */
export const cardListQuery = (deckId: string) =>
  queryOptions<Card[]>({
    queryKey: queryKeys.cards(deckId),
    queryFn: async () => (await apiRequest(`/decks/${deckId}/cards`, CardListSchema)).cards,
  });
