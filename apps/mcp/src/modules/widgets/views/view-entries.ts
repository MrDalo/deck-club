import type { WidgetKey } from '../../../common/mcp/widgets.js';

/**
 * The MCP Apps views that are built, keyed by widget: the key is also the
 * bundle's file name, which `BundledWidgetViews` reads. A view missing here
 * is served as the branded placeholder, so a tool that links to it still
 * works.
 */
export const VIEW_ENTRIES: Readonly<Partial<Record<WidgetKey, string>>> = {
  deckLibrary: 'src/modules/widgets/views/browser/deck-library.view.ts',
  deck: 'src/modules/widgets/views/browser/deck.view.ts',
  searchResults: 'src/modules/widgets/views/browser/search-results.view.ts',
  deckCreated: 'src/modules/widgets/views/browser/deck-created.view.ts',
  cardsAdded: 'src/modules/widgets/views/browser/cards-added.view.ts',
  cardUpdated: 'src/modules/widgets/views/browser/card-updated.view.ts',
  cardsDeleted: 'src/modules/widgets/views/browser/cards-deleted.view.ts',
  studySession: 'src/modules/widgets/views/browser/study-session.view.ts',
  stats: 'src/modules/widgets/views/browser/stats.view.ts',
  clubList: 'src/modules/widgets/views/browser/club-list.view.ts',
};
