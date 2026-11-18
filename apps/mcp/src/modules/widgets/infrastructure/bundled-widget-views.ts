import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Logger } from '@nestjs/common';
import type { WidgetKey } from '../../../common/mcp/widgets.js';
import { WIDGET_CATALOG } from '../application/widget-catalog.js';
import { widgetDocument } from '../application/widget-document.js';
import type { WidgetViews } from '../application/ports/widget-views.js';

/** Where `pnpm build` (scripts/build-views.mjs) writes the bundled views. */
export const VIEW_BUNDLE_DIR = path.join(process.cwd(), 'dist', 'views');

/** Reads a bundle from disk; injectable so tests never touch the file system. */
export type BundleReader = (bundlePath: string) => Promise<string>;

/**
 * Adapter: serves the built, interactive views. Each view is one bundle
 * inlined into the brand document, read once and then kept in memory (a
 * view changes only with a deploy). A view whose bundle is missing — a
 * placeholder view, or a process started without the build — falls back to
 * the placeholder instead of failing the tool that links to it.
 */
export class BundledWidgetViews implements WidgetViews {
  private readonly logger = new Logger('mcp.widgets');
  private readonly documents = new Map<WidgetKey, string>();

  /**
   * @param bundleDir - the directory holding `<widget>.js`
   * @param fallback - serves views that have no bundle
   * @param readBundle - reads a bundle, the file system by default
   */
  constructor(
    private readonly bundleDir: string,
    private readonly fallback: WidgetViews,
    private readonly readBundle: BundleReader = (bundlePath) => readFile(bundlePath, 'utf8'),
  ) {}

  async html(widget: WidgetKey): Promise<string> {
    const cached = this.documents.get(widget);
    if (cached !== undefined) return cached;

    const script = await this.bundleOf(widget);
    if (script === null) return this.fallback.html(widget);

    const { title, description } = WIDGET_CATALOG[widget];
    const document = widgetDocument({ title, description, script });
    this.documents.set(widget, document);
    return document;
  }

  private async bundleOf(widget: WidgetKey): Promise<string | null> {
    try {
      return await this.readBundle(path.join(this.bundleDir, `${widget}.js`));
    } catch {
      this.logger.warn({ evt: 'widget.bundle.missing', widget });
      return null;
    }
  }
}
