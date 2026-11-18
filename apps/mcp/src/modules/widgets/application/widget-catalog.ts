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
      'Due cards to review in the chat: reveal the answer, then rate how well you knew it.',
  },
  stats: {
    name: 'stats_view',
    title: 'Stats',
    description: 'Your streak, today’s progress and retention at a glance.',
  },
};
