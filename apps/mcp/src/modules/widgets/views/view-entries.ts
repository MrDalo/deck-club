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
};
