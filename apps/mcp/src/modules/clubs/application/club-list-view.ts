import type {
  Club,
  ClubDeck,
  ClubSummary,
  DeckSummary,
  ListClubsOutput,
} from '@deck-club/contracts';
import { countLabel } from '../../../common/text/count-label.js';
import { deckUrl, libraryUrl } from '../../../common/web/web-links.js';

const toDeckTile = (deck: ClubDeck, webUrl: string): DeckSummary => ({
  ...deck,
  url: deckUrl(webUrl, deck.id),
});

/**
 * One club as `list_clubs` shows it: what a member may see, with its decks
 * as the same summaries the deck library shows, links included.
 * @param club - the club as the API returns it
 * @param webUrl - the web app's public URL
 * @returns the summary
 */
export function toClubSummary(club: Club, webUrl: string): ClubSummary {
  const { joinedAt: _joinedAt, decks, ...rest } = club;
  return { ...rest, decks: decks.map((deck) => toDeckTile(deck, webUrl)) };
}

/**
 * Turns the API's clubs into the `list_clubs` result: the data its MCP Apps
 * view renders and the AI reads as structured content.
 * @param clubs - the caller's clubs
 * @param webUrl - the web app's public URL
 * @returns the structured result
 */
export function toClubList(clubs: readonly Club[], webUrl: string): ListClubsOutput {
  return {
    clubs: clubs.map((club) => toClubSummary(club, webUrl)),
    clubCount: clubs.length,
    libraryUrl: libraryUrl(webUrl),
  };
}

const clubLine = (club: ClubSummary): string => {
  const invite = club.inviteCode === null ? '' : `, invite code: ${club.inviteCode}`;
  return `- "${club.name}" (club id: ${club.id}, the user is ${club.role}, ${club.memberCount} of ${countLabel(club.memberLimit, 'member')}, ${club.visibility}${invite})`;
};

const deckLine = (deck: DeckSummary): string =>
  `    - "${deck.title}" (deck id: ${deck.id}, language: ${deck.language}, ${countLabel(deck.cardCount, 'card')})`;

const clubLines = (club: ClubSummary): string[] => [
  clubLine(club),
  ...(club.description === '' ? [] : [`  About: ${club.description}`]),
  club.decks.length === 0 ? '  No shared decks yet.' : `  Shared decks (${club.decks.length}):`,
  ...club.decks.map(deckLine),
];

/**
 * The same result written for the AI: one block per club with the ids it
 * needs to chain calls, the user's role (what they may do there, spec 7),
 * and the club's shared decks. The invite code is there only when the
 * user's role may invite.
 * @param output - the structured result
 * @returns compact text, or guidance when the user is in no club
 */
export function formatClubList(output: ListClubsOutput): string {
  if (output.clubCount === 0)
    return 'The user is not in any club yet. A club shares decks with a group; clubs are created and joined in Deck Club with an invite code.';
  return [
    `The user belongs to ${countLabel(output.clubCount, 'club')}:`,
    ...output.clubs.flatMap(clubLines),
  ].join('\n');
}
