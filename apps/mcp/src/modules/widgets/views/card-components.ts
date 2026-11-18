import type { DeckCard } from '@deck-club/contracts';
import { chip } from './components.js';
import { highlight } from './highlight.js';

/** How an index card is shown in a given view. */
export type IndexCardOptions = {
  /** Search words to mark on the card, folded (see `highlightTermsOf`). */
  terms?: readonly string[];
  /** Chips before the card's own, e.g. the deck a search result is in. */
  leadingChips?: readonly string[];
  /** Buttons under the card. */
  actions?: string;
};

const cardChips = (card: DeckCard, leading: readonly string[]): string => {
  const chips = [
    ...leading,
    ...(card.type === 'reversible' ? [chip('Reversible', 'sky')] : []),
    ...card.tags.map((tag) => chip(tag, 'paper', `Tag: ${tag}`)),
    ...(card.addedBy === null ? [] : [chip(`Added by ${card.addedBy}`, 'mint')]),
  ];
  return chips.length === 0 ? '' : `<p class="card-meta">${chips.join('')}</p>`;
};

/**
 * One card as a ruled index card, like the web app's card preview: its two
 * sides, its extra text, and chips for Reversible, tags and "Added by
 * Claude". Every text is escaped; search words are marked.
 * @param card - the card
 * @param options - words to mark, chips to add, buttons
 * @returns a list item
 */
export function indexCard(card: DeckCard, options: IndexCardOptions = {}): string {
  const terms = options.terms ?? [];
  return `
      <li class="card">
        <div class="card-sides">
          <div class="ruled card-side">
            <span class="card-label">Front</span>
            <p class="card-front">${highlight(card.front, terms)}</p>
          </div>
          <div class="ruled card-side">
            <span class="card-label">Back</span>
            <p class="card-back">${highlight(card.back, terms)}</p>
            ${card.extra === '' ? '' : `<p class="card-extra">${highlight(card.extra, terms)}</p>`}
          </div>
        </div>
        ${cardChips(card, options.leadingChips ?? [])}
        ${options.actions === undefined ? '' : `<div class="actions card-actions">${options.actions}</div>`}
      </li>`;
}
