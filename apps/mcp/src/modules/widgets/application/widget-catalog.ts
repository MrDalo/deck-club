import type { WidgetKey } from '../../../common/mcp/widgets.js';

/** How a view is listed to hosts, and what it is for. */
export type WidgetDescription = {
  /** Stable programmatic resource name. */
  name: string;
  title: string;
  /** One sentence for the host's resource list. */
  description: string;
};

/** Every MCP Apps view Deck Club publishes (spec 13: an in-chat review UI). */
export const WIDGET_CATALOG: Readonly<Record<WidgetKey, WidgetDescription>> = {
  deckLibrary: {
    name: 'deck_library_view',
    title: 'Deck library',
    description:
      'The user’s decks as index cards: card counts, languages and a link into Deck Club.',
  },
  deck: {
    name: 'deck_view',
    title: 'Deck',
    description:
      'One deck and its cards as ruled index cards, with who added them and a button for the next page.',
  },
  deckCreated: {
    name: 'deck_created_view',
    title: 'Deck created',
    description:
      'A deck just created, as its index card in the library, with the next steps to fill it with cards.',
  },
  cardsAdded: {
    name: 'cards_added_view',
    title: 'Cards added',
    description:
      'The cards just added to a deck, as ruled index cards marked with the assistant that wrote them, with the next steps.',
  },
  cardUpdated: {
    name: 'card_updated_view',
    title: 'Card updated',
    description:
      'One card just edited, as a ruled index card, with each change shown before and after and a button to undo it.',
  },
  cardsDeleted: {
    name: 'cards_deleted_view',
    title: 'Cards deleted',
    description:
      'The cards just deleted from a deck, what could not be deleted, and a button to add them back as new cards.',
  },
  searchResults: {
    name: 'search_results_view',
    title: 'Search results',
    description:
      'The cards that matched a search, with their deck and the words highlighted, and a box to search again.',
  },
  studySession: {
    name: 'study_session_view',
    title: 'Study session',
    description:
      'The cards due for review now, each answer hidden until you show it, then rated Again, Hard, Good or Easy right here, or in a quiz in the chat.',
  },
  stats: {
    name: 'stats_view',
    title: 'Stats',
    description:
      'Your streak, today’s progress and retention at a glance, what is still due per deck, and the cards you keep forgetting.',
  },
  clubList: {
    name: 'club_list_view',
    title: 'Your clubs',
    description:
      'The clubs you belong to, your role in each, how many members they have, and the decks they share.',
  },
};
