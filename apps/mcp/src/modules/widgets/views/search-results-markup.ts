import {
  type CardMatch,
  CARD_SEARCH_LIMITS,
  type McpToolName,
  type SearchCardsOutput,
  SearchCardsOutputSchema,
} from '@deck-club/contracts';
import { indexCard } from './card-components.js';
import { askForCardsAbout } from './chat-messages.js';
import {
  actionButton,
  countLabel,
  deckChip,
  emptyState,
  pageHeader,
  searchForm,
} from './components.js';
import { deckAccent } from './deck-accent.js';
import { highlightTermsOf } from './highlight.js';
import { readToolOutput, type ToolResultLike } from './tool-output.js';

/** The view action that runs a new search; its value is the typed words. */
export const SEARCH_ACTION = 'search';

/** The server tool the view calls, through the host, to search again. */
export const SEARCH_TOOL: McpToolName = 'search_cards';

const searchLead = (output: SearchCardsOutput): string => {
  if (output.totalMatches === 0) return 'No matches.';
  const decks = new Set(output.matches.map((match) => match.deck.id)).size;
  const found = `${countLabel(output.totalMatches, 'match', 'matches')} in ${countLabel(decks, 'deck')}`;
  return output.matches.length < output.totalMatches
    ? `${found} · showing the ${output.matches.length} best`
    : found;
};

const matchCard = (match: CardMatch, terms: readonly string[]): string =>
  indexCard(match.card, {
    terms,
    leadingChips: [deckChip(match.deck.title, deckAccent(match.deck.id))],
    actions: actionButton({
      label: 'Open deck',
      action: 'open',
      value: match.deck.url,
      variant: 'secondary',
      accessibleName: `Open ${match.deck.title} in Deck Club`,
    }),
  });

/**
 * A search as the chat shows it: a search box to try other words, then each
 * matching card as a ruled index card with its deck and the words marked in
 * the brand's highlighter. When nothing matches, it says so and offers to
 * make cards about it — the search exists to avoid duplicates (spec 9).
 * @param output - the `search_cards` result
 * @returns the HTML of the view's body
 */
export function renderSearchResults(output: SearchCardsOutput): string {
  const header = `${pageHeader({ title: `Cards matching "${output.query}"`, lead: searchLead(output) })}${searchForm(SEARCH_ACTION, output.query)}`;
  if (output.totalMatches === 0)
    return `${header}${emptyState(
      'No card about this yet',
      'You can add it without writing a duplicate.',
      actionButton({
        label: 'Make cards about it',
        action: 'ask',
        value: askForCardsAbout(output.query),
      }),
    )}`;
  const terms = highlightTermsOf(output.query);
  const more =
    output.matches.length < output.totalMatches
      ? `<p class="lead page-status">Narrow the search to see the other ${output.totalMatches - output.matches.length}.</p>`
      : '';
  return `${header}
    <ol class="card-list">${output.matches.map((match) => matchCard(match, terms)).join('')}
    </ol>${more}`;
}

/**
 * The arguments of a new search from the view: the typed words, in the same
 * scope (one deck or all) as the search on screen.
 * @param shown - the search on screen
 * @param query - the new words
 * @returns the `search_cards` arguments
 */
export function nextSearchArguments(
  shown: SearchCardsOutput,
  query: string,
): { query: string; deckId?: string; limit: number } {
  return {
    query: query.trim(),
    ...(shown.deckId !== null && { deckId: shown.deckId }),
    limit: CARD_SEARCH_LIMITS.results.default,
  };
}

/**
 * Reads the result of a search the view ran itself.
 * @param result - the tool result the host relayed
 * @returns the results, or null when the tool refused or the result breaks the contract
 */
export function readSearchResults(result: ToolResultLike): SearchCardsOutput | null {
  return readToolOutput(SearchCardsOutputSchema, result);
}
