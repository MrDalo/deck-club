import type { DeckSummary } from '@deck-club/contracts';
import { chip, countLabel } from './components.js';
import { deckAccent } from './deck-accent.js';
import { escapeHtml } from './escape-html.js';

/** What a deck tile shows besides the deck itself. */
export type DeckTileOptions = {
  /** Chips after the language and card count, e.g. tags or "Private". */
  extraChips?: readonly string[];
  /** Buttons at the bottom of the tile. */
  actions: string;
  /** The title's heading level: 2 in a list of decks, 3 under a heading of its own (a club). */
  headingLevel?: 2 | 3;
};

/**
 * One deck as an index card with its pastel tab, like a tile in the web
 * app's library: title, description, language, card count and buttons.
 * @param deck - the deck
 * @param options - extra chips and the buttons
 * @returns a list item
 */
export function deckTile(deck: DeckSummary, options: DeckTileOptions): string {
  const level = options.headingLevel ?? 2;
  const description =
    deck.description === ''
      ? ''
      : `<p class="deck-description">${escapeHtml(deck.description)}</p>`;
  return `
      <li>
        <article class="deck" style="--deck-accent: ${deckAccent(deck.id)}">
          <span class="deck-tab" aria-hidden="true"></span>
          <div class="deck-body">
            <h${level}>${escapeHtml(deck.title)}</h${level}>
            ${description}
            <p class="deck-meta">
              ${chip(deck.language, 'paper', `Language: ${deck.language}`)}
              <span>${countLabel(deck.cardCount, 'card')}</span>
              ${(options.extraChips ?? []).join('')}
            </p>
            <div class="actions">
              ${options.actions}
            </div>
          </div>
        </article>
      </li>`;
}
