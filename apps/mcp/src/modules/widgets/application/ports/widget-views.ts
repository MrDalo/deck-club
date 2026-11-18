import type { WidgetKey } from '../../../../common/mcp/widgets.js';

/**
 * Port: the HTML document of an MCP Apps view, self-contained (inline
 * scripts and styles, no external requests) because hosts render it in a
 * sandboxed iframe under a strict Content Security Policy.
 */
export type WidgetViews = {
  html(widget: WidgetKey): Promise<string>;
};

/** Nest injection token for {@link WidgetViews}. */
export const WIDGET_VIEWS = Symbol('WIDGET_VIEWS');
