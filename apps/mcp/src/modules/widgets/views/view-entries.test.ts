import { access } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { WIDGET_URIS } from '../../../common/mcp/widgets.js';
import { VIEW_ENTRIES } from './view-entries.js';

describe('VIEW_ENTRIES', () => {
  it('names only views the server publishes', () => {
    for (const widget of Object.keys(VIEW_ENTRIES)) expect(WIDGET_URIS).toHaveProperty(widget);
  });

  it('points at entry files that exist', async () => {
    for (const entry of Object.values(VIEW_ENTRIES))
      await expect(access(path.join(process.cwd(), entry))).resolves.toBeUndefined();
  });

  it('builds the views of the four tools with a UI so far', () => {
    expect(Object.keys(VIEW_ENTRIES)).toEqual([
      'deckLibrary',
      'deck',
      'searchResults',
      'deckCreated',
    ]);
  });
});
