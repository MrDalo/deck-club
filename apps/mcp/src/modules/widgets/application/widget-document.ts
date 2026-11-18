import { BRAND_CSS, FONT_STYLESHEET_URL } from '../views/brand.js';
import { escapeHtml } from '../views/escape-html.js';

/** What a view's HTML document needs. */
export type WidgetDocumentOptions = {
  title: string;
  description: string;
  /** The view's bundled script; omitted while a view is still a placeholder. */
  script?: string;
};

/** A `</script>` inside the bundle would end the tag early; this keeps it inert. */
const inlineScript = (script: string): string =>
  `<script>${script.replaceAll(/<\/(script)/gi, String.raw`<\/$1`)}</script>`;

/**
 * The HTML document of an MCP Apps view: one self-contained file with the
 * brand's tokens and typefaces, because hosts render it in a sandboxed
 * iframe. The view's script fills `#deck-club-view`; without a script (a
 * view that is not built yet) the document says so, and `<noscript>` keeps
 * it readable where scripts cannot run.
 * @param view - the view's title, summary and bundle
 * @returns the whole document
 */
export function widgetDocument(view: WidgetDocumentOptions): string {
  const title = escapeHtml(view.title);
  const description = escapeHtml(view.description);
  const body =
    view.script === undefined
      ? `<header>
      <h1><span class="highlight">Deck Club</span> · ${title}</h1>
      <p class="lead">${description}</p>
    </header>
    <p class="lead">This view is coming soon. The answer in the chat has everything you need.</p>`
      : `<p class="lead">Loading…</p>
    <noscript><p class="lead">${description}</p></noscript>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Deck Club · ${title}</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONT_STYLESHEET_URL}">
<style>${BRAND_CSS}</style>
</head>
<body>
<main id="deck-club-view" aria-live="polite">
    ${body}
</main>
${view.script === undefined ? '' : inlineScript(view.script)}
</body>
</html>
`;
}
