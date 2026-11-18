/**
 * The Deck Club look inside a chat: the same tokens, fonts and motifs as the
 * web app (`apps/web/src/app/globals.css`, `brand/README.md`), written as
 * plain CSS because a view is one self-contained HTML document. Light mode
 * only, by brand decision: the palette is paper and highlighter.
 */

/** The two brand typefaces, as the web app loads them. */
export const FONT_STYLESHEET_URL =
  'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Bricolage+Grotesque:opsz,wght@12..96,700..800&display=swap';

/** Where the fonts come from; the view's Content Security Policy must allow these. */
export const FONT_DOMAINS = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

/** Brand CSS shared by every view. */
export const BRAND_CSS = `
:root {
  color-scheme: light;
  --color-paper: #faf8ff;
  --color-card: #ffffff;
  --color-ink: #24203a;
  --color-ink-soft: #5b5575;
  --color-line: #e4def5;
  --color-focus: #6e56cf;
  --color-lilac: #cdbffb;
  --color-mint: #bdebd6;
  --color-peach: #ffd3b8;
  --color-rose: #f9c2d1;
  --color-sky: #c3e0fa;
  --color-butter: #fff0a8;
  --font-display: 'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif;
  --font-sans: 'Atkinson Hyperlegible', ui-sans-serif, system-ui, sans-serif;
  --shadow-sticker-sm: 2px 2px 0 0 var(--color-ink);
  --radius-card: 1.25rem;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  padding: 12px;
  background-color: var(--color-paper);
  color: var(--color-ink);
  font-family: var(--font-sans);
  font-size: 15px;
  line-height: 1.55;
  -webkit-text-size-adjust: 100%;
}
h1, h2 { font-family: var(--font-display); letter-spacing: -0.02em; line-height: 1.1; margin: 0; }
h1 { font-size: 1.5rem; font-weight: 800; }
h2 { font-size: 1.05rem; font-weight: 700; }
p { margin: 0; }
:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
.highlight {
  background-image: linear-gradient(100deg, transparent 0.2em, var(--highlight, var(--color-butter)) 0.35em, var(--highlight, var(--color-butter)) calc(100% - 0.25em), transparent 100%);
  background-repeat: no-repeat;
  background-size: 100% 0.62em;
  background-position: 0 88%;
  padding-inline: 0.12em;
}
.lead { margin-top: 6px; color: var(--color-ink-soft); }
.deck-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); list-style: none; margin: 16px 0 0; padding: 0; }
.deck {
  height: 100%;
  overflow: hidden;
  border: 2px solid var(--color-ink);
  border-radius: var(--radius-card);
  background-color: var(--color-card);
  box-shadow: var(--shadow-sticker-sm);
  transition: transform 120ms ease;
}
.deck:hover { transform: translateY(-2px) rotate(-0.6deg); }
.deck-tab { display: block; height: 12px; border-bottom: 2px solid var(--color-ink); background-color: var(--deck-accent, var(--color-lilac)); }
.deck-body { display: flex; flex-direction: column; gap: 8px; padding: 12px 14px 14px; }
.deck-description { color: var(--color-ink-soft); font-size: 0.9rem; }
.deck-meta { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; }
.chip { display: inline-block; border-radius: 999px; background-color: var(--color-paper); padding: 1px 9px; font-size: 0.8rem; font-weight: 700; }
.chip-paper { background-color: var(--color-paper); }
.chip-sky { background-color: var(--color-sky); }
.chip-mint { background-color: var(--color-mint); }
.chip-deck { background-color: var(--deck-accent, var(--color-lilac)); border: 1.5px solid var(--color-ink); }
.deck-meta .chip { text-transform: uppercase; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 2px; }
.button {
  border: 2px solid var(--color-ink);
  border-radius: 999px;
  background-color: var(--color-lilac);
  box-shadow: var(--shadow-sticker-sm);
  padding: 5px 12px;
  font: inherit;
  font-weight: 700;
  color: var(--color-ink);
  cursor: pointer;
}
.button:hover { background-color: var(--color-butter); }
.button:active { transform: translate(2px, 2px); box-shadow: none; }
.button:disabled { cursor: progress; opacity: 0.6; box-shadow: none; }
.button-secondary { background-color: var(--color-card); }
.actions-centered { justify-content: center; }
.ruled {
  background-color: var(--color-card);
  background-image: linear-gradient(var(--color-rose), var(--color-rose)), repeating-linear-gradient(transparent 0 1.9rem, var(--color-line) 1.9rem 2rem);
  background-size: 100% 2px, 100% 100%;
  background-position: 0 2.5rem, 0 2.5rem;
  background-repeat: no-repeat, repeat;
}
.card-list { display: grid; gap: 14px; list-style: none; margin: 16px 0 0; padding: 0; }
.card-sides { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); }
.card-side { min-height: 7rem; border: 2px solid var(--color-ink); border-radius: 1rem; box-shadow: var(--shadow-sticker-sm); padding: 10px 14px 12px; overflow-wrap: anywhere; }
.card-side:first-child { transform: rotate(-0.6deg); }
.card-side:last-child { transform: rotate(0.4deg); }
.card-label { display: block; height: 1.75rem; color: var(--color-ink-soft); font-size: 0.75rem; font-weight: 700; }
.card-front, .card-back { margin-top: 8px; line-height: 2rem; white-space: pre-wrap; }
.card-front { font-family: var(--font-display); font-size: 1.05rem; font-weight: 700; }
.card-extra { color: var(--color-ink-soft); font-size: 0.9rem; line-height: 2rem; white-space: pre-wrap; }
.card-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.page-status { margin-top: 12px; font-size: 0.9rem; }
.card-actions { margin-top: 8px; }
mark {
  color: inherit;
  background-color: transparent;
  background-image: linear-gradient(100deg, transparent 0.1em, var(--color-butter) 0.2em, var(--color-butter) calc(100% - 0.1em), transparent 100%);
  background-repeat: no-repeat;
  background-size: 100% 0.7em;
  background-position: 0 85%;
}
.search { display: flex; gap: 8px; margin-top: 14px; }
.search-input {
  flex: 1;
  min-width: 0;
  border: 2px solid var(--color-ink);
  border-radius: 999px;
  background-color: var(--color-card);
  padding: 6px 14px;
  font: inherit;
  color: var(--color-ink);
}
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.deck-grid-single { grid-template-columns: minmax(0, 22rem); }
.panel { margin-top: 16px; border: 2px solid var(--color-ink); border-radius: var(--radius-card); background-color: var(--color-butter); padding: 14px 16px; }
.panel .lead { margin-bottom: 10px; }
.changes { display: grid; gap: 8px; margin: 4px 0 12px; }
.change { display: grid; grid-template-columns: 4.5rem minmax(0, 1fr); gap: 8px; align-items: baseline; }
.change dt { color: var(--color-ink-soft); font-size: 0.75rem; font-weight: 700; }
.change dd { margin: 0; overflow-wrap: anywhere; white-space: pre-wrap; }
.change del { color: var(--color-ink-soft); text-decoration-thickness: 2px; }
.change ins { text-decoration: none; font-weight: 700; }
.change-arrow { color: var(--color-ink-soft); }
.change-none { font-weight: 400; }
.deleted-list { display: grid; gap: 8px; list-style: none; margin: 16px 0 0; padding: 0; }
.deleted-card { border: 2px dashed rgba(36, 32, 58, 0.4); border-radius: 1rem; background-color: var(--color-card); padding: 8px 14px; overflow-wrap: anywhere; }
.deleted-front { font-weight: 700; white-space: pre-wrap; }
.deleted-back { color: var(--color-ink-soft); font-size: 0.9rem; white-space: pre-wrap; }
.empty { margin-top: 16px; border: 2px dashed rgba(36, 32, 58, 0.4); border-radius: var(--radius-card); padding: 24px; text-align: center; }
.empty-title { font-family: var(--font-display); font-size: 1.15rem; font-weight: 700; }
.footer { margin-top: 14px; }
.notice { margin-top: 16px; border: 2px solid var(--color-ink); border-radius: var(--radius-card); background-color: var(--color-rose); padding: 14px 16px; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
}
`;
