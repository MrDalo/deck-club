import { escapeHtml } from './escape-html.js';

/**
 * The building blocks every view is made of, as HTML strings styled by
 * `brand.ts`. They escape everything they are given, so a view never puts
 * deck or card text into markup unescaped.
 */

/** "1 card" or "N cards": shared with the text the AI reads, so both count alike. */
export { countLabel } from '../../../common/text/count-label.js';

/** What a page header shows. */
export type PageHeaderOptions = {
  title: string;
  lead: string;
  /** The highlighter colour behind the title; butter by default, a deck's own pastel on a deck. */
  accent?: string;
};

/**
 * The heading of a view, with the brand's highlighter swipe behind the title.
 * @param options - title, lead and optional highlighter colour
 * @returns the header
 */
export function pageHeader(options: PageHeaderOptions): string {
  const style = options.accent === undefined ? '' : ` style="--highlight: ${options.accent}"`;
  return `
    <header>
      <h1><span class="highlight"${style}>${escapeHtml(options.title)}</span></h1>
      <p class="lead">${escapeHtml(options.lead)}</p>
    </header>`;
}

/**
 * Marks the one control that takes the keyboard focus after a view's own
 * action redraws the view, e.g. the next card to study after a rating, so a
 * keyboard or screen reader user is not sent back to the top.
 */
export const FOCUS_ATTRIBUTE = 'data-focus';

/** What a button does and looks like. */
export type ButtonOptions = {
  label: string;
  /** `open`, `ask`, or a view's own action such as `more`; see `hostActionFor`. */
  action: string;
  value: string;
  variant?: 'primary' | 'secondary';
  /** A fuller name for screen readers when the label alone is ambiguous ("Open deck" × 10). */
  accessibleName?: string;
  /** Takes the focus after the view's own action redraws it (see {@link FOCUS_ATTRIBUTE}). */
  focus?: boolean;
};

/**
 * A sticker button that asks the host for something.
 * @param options - the button
 * @returns the button
 */
export function actionButton(options: ButtonOptions): string {
  const variant = options.variant === 'secondary' ? 'button button-secondary' : 'button';
  const name =
    options.accessibleName === undefined
      ? ''
      : ` aria-label="${escapeHtml(options.accessibleName)}"`;
  const focus = options.focus === true ? ` ${FOCUS_ATTRIBUTE}` : '';
  return `<button class="${variant}" type="button" data-action="${escapeHtml(options.action)}" data-value="${escapeHtml(options.value)}"${name}${focus}>${escapeHtml(options.label)}</button>`;
}

/** Fill colours of the brand's pill chips (brand/README.md: pastels are fills). */
export type ChipTone = 'paper' | 'sky' | 'mint' | 'rose' | 'peach';

/**
 * A small pill: a language code, a card type, a tag, "Added by Claude".
 * @param text - what it says
 * @param tone - its fill
 * @param accessibleName - a fuller name for screen readers
 * @returns the chip
 */
export function chip(text: string, tone: ChipTone = 'paper', accessibleName?: string): string {
  const name = accessibleName === undefined ? '' : ` aria-label="${escapeHtml(accessibleName)}"`;
  return `<span class="chip chip-${tone}"${name}>${escapeHtml(text)}</span>`;
}

/**
 * A chip naming a deck, filled with the deck's own pastel (its tab colour in
 * the library).
 * @param title - the deck's title
 * @param accent - the deck's pastel, from `deckAccent`
 * @returns the chip
 */
export function deckChip(title: string, accent: string): string {
  return `<span class="chip chip-deck" style="--deck-accent: ${accent}" aria-label="Deck: ${escapeHtml(title)}">${escapeHtml(title)}</span>`;
}

/**
 * A message shown instead of, or below, a view's content, in the brand's
 * voice: what happened and what to do, without apologising.
 * @param message - the sentence to show
 * @returns the notice
 */
export function notice(message: string): string {
  return `
    <div class="notice" role="status">
      <p>${escapeHtml(message)}</p>
    </div>`;
}

/**
 * The dashed panel a view shows when there is nothing to list yet.
 * @param title - what is missing
 * @param lead - what the user can do about it
 * @param button - the one action that helps
 * @returns the panel
 */
export function emptyState(title: string, lead: string, button: string): string {
  return `
    <div class="empty">
      <p class="empty-title">${escapeHtml(title)}</p>
      <p class="lead">${escapeHtml(lead)}</p>
      <div class="actions actions-centered">${button}</div>
    </div>`;
}

/** The name of the one field of a {@link searchForm}; the runtime reads it. */
export const SEARCH_FIELD_NAME = 'value';

/**
 * A search box that runs a view action on submit (Enter or the button).
 * @param action - the view action to run with the typed words
 * @param value - the current search, shown in the box
 * @returns the form
 */
export function searchForm(action: string, value: string): string {
  return `
    <form class="search" role="search" data-action="${escapeHtml(action)}">
      <label class="visually-hidden" for="deck-club-search">Search your cards</label>
      <input id="deck-club-search" class="search-input" type="search" name="${SEARCH_FIELD_NAME}" value="${escapeHtml(value)}" maxlength="200" required autocomplete="off">
      <button class="button" type="submit">Search</button>
    </form>`;
}
