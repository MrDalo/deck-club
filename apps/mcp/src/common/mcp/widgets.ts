/**
 * MCP Apps views (interactive UI rendered inside the chat by Claude, ChatGPT
 * and other hosts that support the MCP Apps extension). A tool links to one
 * with `_meta.ui.resourceUri`; the widgets module serves the HTML.
 */
export const WIDGET_URIS = {
  /** The user's deck library, shown with the result of list_decks. */
  deckLibrary: 'ui://deck-club/deck-library.html',
  /** A deck and its cards, shown with the result of get_deck. */
  deck: 'ui://deck-club/deck.html',
  /** A deck just made, with what to do next, shown with the result of create_deck. */
  deckCreated: 'ui://deck-club/deck-created.html',
  /** The cards just added to a deck, with what to do next, shown with the result of add_cards. */
  cardsAdded: 'ui://deck-club/cards-added.html',
  /** One card just edited, with what changed and a way to undo it, shown with the result of update_card. */
  cardUpdated: 'ui://deck-club/card-updated.html',
  /** The cards just deleted from a deck, with a way to add them back, shown with the result of delete_cards. */
  cardsDeleted: 'ui://deck-club/cards-deleted.html',
  /** The cards that matched a search, shown with the result of search_cards. */
  searchResults: 'ui://deck-club/search-results.html',
  /** An in-chat review session over due cards (spec 4.5). */
  studySession: 'ui://deck-club/study-session.html',
  /** Streak, today's progress and retention (spec 6, stats). */
  stats: 'ui://deck-club/stats.html',
  /** The clubs the user belongs to and their shared decks, shown with the result of list_clubs. */
  clubList: 'ui://deck-club/club-list.html',
} as const;
export type WidgetKey = keyof typeof WIDGET_URIS;
export type WidgetUri = (typeof WIDGET_URIS)[WidgetKey];
