/** The one query-key factory: every cache key in the app is built here so invalidation stays exact. */
export const queryKeys = {
  decks: () => ['decks'] as const,
  deck: (deckId: string) => ['decks', deckId] as const,
  cards: (deckId: string) => ['decks', deckId, 'cards'] as const,
};
