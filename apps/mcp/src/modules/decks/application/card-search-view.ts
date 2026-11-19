import type {
  CardSearchResult,
  SearchCardsOutput,
  SearchCardsToolInput,
} from '@deck-club/contracts';
import { deckUrl } from '../../../common/web/web-links.js';
import { describeCard, toDeckCard } from './deck-detail-view.js';

/**
 * Turns the API's matches into the `search_cards` result: the data its MCP
 * Apps view renders, echoing the search so the view can show it and search
 * again in the same scope.
 * @param result - the API's matches, best first
 * @param input - the search as the AI sent it
 * @param webUrl - the web app's public URL
 * @returns the structured result
 */
export function toSearchResults(
  result: CardSearchResult,
  input: SearchCardsToolInput,
  webUrl: string,
): SearchCardsOutput {
  return {
    query: input.query,
    deckId: input.deckId ?? null,
    matches: result.hits.map((hit) => ({
      card: toDeckCard(hit.card),
      deck: { id: hit.card.deckId, title: hit.deckTitle, url: deckUrl(webUrl, hit.card.deckId) },
      matchedIn: hit.matchedIn,
    })),
    totalMatches: result.totalMatches,
  };
}

const matchesLabel = (count: number): string =>
  count === 1 ? '1 card matches' : `${count} cards match`;

/**
 * The same result written for the AI: what matched, where, with the ids to
 * act on, and a plain verdict when nothing did — the tool exists so the AI
 * can check before it adds a card the user already has (spec 9).
 * @param output - the structured result
 * @returns compact text
 */
export function formatSearchResults(output: SearchCardsOutput): string {
  const scope = output.deckId === null ? 'across all decks' : 'in the chosen deck';
  if (output.totalMatches === 0)
    return `No cards match "${output.query}" ${scope}. The user has no card about it yet, so it is safe to add one.`;
  const lines = [`${matchesLabel(output.totalMatches)} "${output.query}" ${scope}:`];
  output.matches.forEach((match, index) => {
    lines.push(
      `${index + 1}. in "${match.deck.title}" (deck id: ${match.deck.id}, card id: ${match.card.id}) ${describeCard(match.card)} | matched in: ${match.matchedIn.join(', ')}`,
    );
  });
  if (output.matches.length < output.totalMatches)
    lines.push(
      `Showing the ${output.matches.length} best. Narrow the search, or raise limit (up to 50) to see more.`,
    );
  return lines.join('\n');
}
