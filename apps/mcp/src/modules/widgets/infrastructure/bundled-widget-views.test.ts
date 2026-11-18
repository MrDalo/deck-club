import { describe, expect, it, vi } from 'vitest';
import type { WidgetKey } from '../../../common/mcp/widgets.js';
import type { WidgetViews } from '../application/ports/widget-views.js';
import { BundledWidgetViews, type BundleReader } from './bundled-widget-views.js';

const placeholder: WidgetViews = { html: (widget) => Promise.resolve(`placeholder:${widget}`) };
const BUNDLE = 'console.log("deck library")';

function views(reader: BundleReader): { views: BundledWidgetViews; reader: typeof reader } {
  const spied = vi.fn(reader);
  return { views: new BundledWidgetViews('/app/dist/views', placeholder, spied), reader: spied };
}

describe('BundledWidgetViews', () => {
  it('inlines the view’s bundle into the brand document', async () => {
    const { views: bundled, reader } = views(() => Promise.resolve(BUNDLE));

    const html = await bundled.html('deckLibrary');

    expect(html).toContain('<title>Deck Club · Deck library</title>');
    expect(html).toContain(`<script>${BUNDLE}</script>`);
    expect(vi.mocked(reader).mock.calls[0]?.[0]).toBe('/app/dist/views/deckLibrary.js');
  });

  it('reads each bundle once and serves it from memory after that', async () => {
    const { views: bundled, reader } = views(() => Promise.resolve(BUNDLE));

    const [first, second] = [await bundled.html('deckLibrary'), await bundled.html('deckLibrary')];

    expect(first).toBe(second);
    expect(reader).toHaveBeenCalledTimes(1);
  });

  it('falls back to the placeholder for a view that has no bundle', async () => {
    const { views: bundled } = views(() => Promise.reject(new Error('ENOENT')));

    await expect(bundled.html('stats')).resolves.toBe('placeholder:stats');
  });

  it('does not cache the fallback, so a later deploy can serve the real view', async () => {
    let bundle: string | null = null;
    const { views: bundled } = views(() =>
      bundle === null ? Promise.reject(new Error('ENOENT')) : Promise.resolve(bundle),
    );

    await bundled.html('deckLibrary');
    bundle = BUNDLE;

    await expect(bundled.html('deckLibrary')).resolves.toContain(`<script>${BUNDLE}</script>`);
  });

  it('serves the bundle built by pnpm build for the deck library view', async () => {
    const real = new BundledWidgetViews(`${process.cwd()}/dist/views`, placeholder);

    const html = await real.html('deckLibrary' satisfies WidgetKey);

    expect(html).toContain('Your decks');
    expect(html).toContain('<main id="deck-club-view"');
  });
});
