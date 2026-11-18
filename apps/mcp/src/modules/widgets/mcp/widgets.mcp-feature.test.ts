import { RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import type { Client } from '@modelcontextprotocol/client';
import { afterEach, describe, expect, it } from 'vitest';
import { DeckClubError } from '../../../common/errors/deck-club-error.js';
import { connectFeature } from '../../../common/mcp/testing/mcp-test-client.js';
import { WIDGET_URIS } from '../../../common/mcp/widgets.js';
import type { WidgetViews } from '../application/ports/widget-views.js';
import { BundledWidgetViews } from '../infrastructure/bundled-widget-views.js';
import { PlaceholderWidgetViews } from '../infrastructure/placeholder-widget-views.js';
import { WidgetsMcpFeature } from './widgets.mcp-feature.js';

let client: Client | undefined;

async function connect(
  views: WidgetViews = new BundledWidgetViews(
    `${process.cwd()}/dist/views`,
    new PlaceholderWidgetViews(),
  ),
): Promise<Client> {
  client = await connectFeature(new WidgetsMcpFeature(views));
  return client;
}

afterEach(async () => {
  await client?.close();
  client = undefined;
});

describe('WidgetsMcpFeature', () => {
  it('lists every view as an MCP Apps resource', async () => {
    const { resources } = await (await connect()).listResources();

    expect(resources.map((resource) => resource.uri).sort()).toEqual(
      Object.values(WIDGET_URIS).sort(),
    );
    for (const resource of resources) expect(resource.mimeType).toBe(RESOURCE_MIME_TYPE);
  });

  it('serves the view HTML with the MCP Apps MIME type and a policy allowing only the brand fonts', async () => {
    const { contents } = await (await connect()).readResource({ uri: WIDGET_URIS.stats });

    expect(contents).toHaveLength(1);
    expect(contents[0]).toMatchObject({
      uri: WIDGET_URIS.stats,
      mimeType: 'text/html;profile=mcp-app',
      _meta: {
        ui: {
          csp: {
            connectDomains: [],
            resourceDomains: ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
          },
          prefersBorder: true,
        },
      },
    });
    expect((contents[0] as { text: string }).text).toContain('Deck Club · Stats');
  });

  it('serves the built deck library view, the one with an interactive UI', async () => {
    const { contents } = await (await connect()).readResource({ uri: WIDGET_URIS.deckLibrary });

    expect((contents[0] as { text: string }).text).toContain('Your decks');
  });

  it('reports a view that cannot be loaded as a REJECTED protocol error', async () => {
    const broken: WidgetViews = {
      html: () => Promise.reject(new DeckClubError('INTERNAL', 'The view bundle is missing.')),
    };

    await expect((await connect(broken)).readResource({ uri: WIDGET_URIS.deck })).rejects.toThrow(
      /REJECTED: INTERNAL\. The view bundle is missing\./,
    );
  });

  it('adds no tools of its own', async () => {
    expect((await connect()).getServerCapabilities()?.tools).toBeUndefined();
  });
});
