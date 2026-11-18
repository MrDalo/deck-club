import { describe, expect, it } from 'vitest';
import { PlaceholderWidgetViews } from './placeholder-widget-views.js';

const views = new PlaceholderWidgetViews();

describe('PlaceholderWidgetViews', () => {
  it('renders the branded document of a view that is not built yet', async () => {
    const html = await views.html('studySession');

    expect(html).toContain('<title>Deck Club · Study session</title>');
    expect(html).toContain('coming soon');
  });

  it('names what the view will show', async () => {
    expect(await views.html('stats')).toContain('streak');
  });

  it('runs no script, so any host policy allows it', async () => {
    expect(await views.html('deck')).not.toContain('<script');
  });
});
