import type { WidgetKey } from '../../../common/mcp/widgets.js';
import { WIDGET_CATALOG } from '../application/widget-catalog.js';
import { widgetDocument } from '../application/widget-document.js';
import type { WidgetViews } from '../application/ports/widget-views.js';

/**
 * Adapter: a branded, accessible placeholder for a view whose interactive
 * version is not built yet. It carries no script, so it works under the
 * strictest host policy.
 */
export class PlaceholderWidgetViews implements WidgetViews {
  html(widget: WidgetKey): Promise<string> {
    const { title, description } = WIDGET_CATALOG[widget];
    return Promise.resolve(widgetDocument({ title, description }));
  }
}
