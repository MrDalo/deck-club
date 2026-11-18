/**
 * MCP Apps views (interactive UI rendered inside the chat by Claude, ChatGPT
 * and other hosts that support the MCP Apps extension). A tool links to one
 * with `_meta.ui.resourceUri`; the widgets module serves the HTML.
 */
export const WIDGET_URIS = {
  /** The user's deck library, shown with the result of list_decks. */
  deckLibrary: 'ui://deck-club/deck-library.html',
  /** A deck and its cards, e.g. after get_deck or add_cards. */
  deck: 'ui://deck-club/deck.html',
  /** A deck just made, with what to do next, shown with the result of create_deck. */
  deckCreated: 'ui://deck-club/deck-created.html',
  /** The cards that matched a search, shown with the result of search_cards. */
  searchResults: 'ui://deck-club/search-results.html',
  /** An in-chat review session over due cards (spec 4.5). */
  studySession: 'ui://deck-club/study-session.html',
  /** Streak, today's progress and retention (spec 6, stats). */
  stats: 'ui://deck-club/stats.html',
} as const;
export type WidgetKey = keyof typeof WIDGET_URIS;
export type WidgetUri = (typeof WIDGET_URIS)[WidgetKey];
