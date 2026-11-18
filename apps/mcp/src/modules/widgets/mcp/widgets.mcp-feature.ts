import { RESOURCE_MIME_TYPE, registerAppResource } from '@modelcontextprotocol/ext-apps/server';
import type { McpServer } from '@modelcontextprotocol/server';
import { Inject, Injectable } from '@nestjs/common';
import { toProtocolError } from '../../../common/mcp/content-registration.js';
import { McpFeature, type McpFeatureContributor } from '../../../common/mcp/mcp-feature.js';
import { WIDGET_URIS, type WidgetKey } from '../../../common/mcp/widgets.js';
import { WIDGET_CATALOG } from '../application/widget-catalog.js';
import { FONT_DOMAINS } from '../views/brand.js';
import { WIDGET_VIEWS, type WidgetViews } from '../application/ports/widget-views.js';

/**
 * UI metadata every view carries (MCP Apps): no network calls at all, and
 * stylesheets and fonts only from Google Fonts, which is where the web app
 * takes the brand typefaces from; a border, because a view sits between
 * chat messages. A host that blocks the fonts still gets the same layout
 * in the fallback typefaces.
 */
const VIEW_UI_META = {
  csp: { connectDomains: [], resourceDomains: FONT_DOMAINS },
  prefersBorder: true,
};

/**
 * Driving adapter: publishes the MCP Apps views as `ui://` resources. Tools
 * link to them with `_meta.ui.resourceUri`; hosts that support MCP Apps
 * (Claude, ChatGPT, VS Code…) render them in the conversation, and every
 * other host simply shows the tool's text.
 */
@McpFeature()
@Injectable()
export class WidgetsMcpFeature implements McpFeatureContributor {
  constructor(@Inject(WIDGET_VIEWS) private readonly views: WidgetViews) {}

  register(server: McpServer): void {
    for (const widget of Object.keys(WIDGET_URIS) as WidgetKey[]) this.registerView(server, widget);
  }

  private registerView(server: McpServer, widget: WidgetKey): void {
    const uri = WIDGET_URIS[widget];
    const { name, title, description } = WIDGET_CATALOG[widget];
    registerAppResource(
      server,
      name,
      uri,
      { title, description, _meta: { ui: VIEW_UI_META } },
      async () => {
        try {
          const text = await this.views.html(widget);
          return {
            contents: [{ uri, mimeType: RESOURCE_MIME_TYPE, text, _meta: { ui: VIEW_UI_META } }],
          };
        } catch (error) {
          throw toProtocolError(error);
        }
      },
    );
  }
}
