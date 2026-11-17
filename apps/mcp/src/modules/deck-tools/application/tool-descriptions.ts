import type { McpToolName } from '@deck-club/contracts';

/**
 * Tool descriptions are written for the AI (product spec 9): when to use the
 * tool, what good input looks like, and what to confirm with the user.
 */
export const TOOL_DESCRIPTIONS: Readonly<
  Record<McpToolName, { title: string; description: string }>
> = {
  list_decks: {
    title: 'List decks',
    description:
      'List the user’s Deck Club flashcard decks with ids, languages and card counts. Call this first whenever the user names a deck, to find its id.',
  },
  get_deck: {
    title: 'Get deck',
    description:
      'Show one deck and all its cards. Use it before adding cards to avoid duplicates, or when the user asks what a deck contains.',
  },
  create_deck: {
    title: 'Create deck',
    description:
      'Create a new private deck. Check list_decks first so you do not create a duplicate of a deck the user already has.',
  },
  add_cards: {
    title: 'Add cards',
    description:
      'Add 1 to 100 flashcards to a deck in one call. Write one fact per card with a short answer; prefer "reversible" for vocabulary. Tell the user how many cards you added and share the deck link from the result.',
  },
};
