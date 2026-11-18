import { Module } from '@nestjs/common';
import { WIDGET_VIEWS } from './application/ports/widget-views.js';
import { BundledWidgetViews, VIEW_BUNDLE_DIR } from './infrastructure/bundled-widget-views.js';
import { PlaceholderWidgetViews } from './infrastructure/placeholder-widget-views.js';
import { WidgetsMcpFeature } from './mcp/widgets.mcp-feature.js';

/** MCP Apps: the interactive views AI hosts render inside the chat. */
@Module({
  providers: [
    {
      provide: WIDGET_VIEWS,
      useFactory: () => new BundledWidgetViews(VIEW_BUNDLE_DIR, new PlaceholderWidgetViews()),
    },
    WidgetsMcpFeature,
  ],
})
export class WidgetsModule {}
