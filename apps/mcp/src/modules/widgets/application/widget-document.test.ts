import { describe, expect, it } from 'vitest';
import { widgetDocument } from './widget-document.js';

const VIEW = { title: 'Deck library', description: 'The user’s decks as index cards.' };

describe('widgetDocument', () => {
  it('is one complete, titled, English document', () => {
    const html = widgetDocument(VIEW);

    expect(html).toMatch(/^<!doctype html>/);
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<title>Deck Club · Deck library</title>');
    expect(html).toContain('<meta name="viewport"');
  });

  it('carries the brand: the web app’s tokens and both typefaces', () => {
    const html = widgetDocument(VIEW);

    expect(html).toContain('--color-paper: #faf8ff');
    expect(html).toContain('--color-ink: #24203a');
    expect(html).toContain('Bricolage+Grotesque');
    expect(html).toContain('Atkinson+Hyperlegible');
    expect(html).toContain('color-scheme: light');
  });

  it('gives the view a live region to render into', () => {
    expect(widgetDocument(VIEW)).toContain('<main id="deck-club-view" aria-live="polite">');
  });

  it('inlines the view’s bundle, so the document needs no further request', () => {
    const html = widgetDocument({ ...VIEW, script: 'console.log("hello")' });

    expect(html).toContain('<script>console.log("hello")</script>');
    expect(html).toContain('<noscript>');
  });

  it('keeps a closing script tag inside the bundle from ending the tag', () => {
    const html = widgetDocument({ ...VIEW, script: 'const html = "</script><img src=x>";' });

    expect(html).toContain(String.raw`<\/script>`);
    expect(html).not.toContain('</script><img src=x>');
  });

  it('says a view without a bundle is coming soon, and runs no script', () => {
    const html = widgetDocument(VIEW);

    expect(html).toContain('coming soon');
    expect(html).toContain('The user’s decks as index cards.');
    expect(html).not.toContain('<script');
  });

  it('escapes the view’s own text', () => {
    expect(widgetDocument({ title: '<b>x</b>', description: '"y"' })).not.toContain('<b>x</b>');
  });
});
