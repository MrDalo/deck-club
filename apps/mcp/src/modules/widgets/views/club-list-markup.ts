import type { ClubRole, ClubSummary, DeckSummary, ListClubsOutput } from '@deck-club/contracts';
import {
  actionButton,
  chip,
  type ChipTone,
  countLabel,
  emptyState,
  pageHeader,
} from './components.js';
import { deckTile } from './deck-components.js';
import { escapeHtml } from './escape-html.js';

/** The user's role as its chip says it, each in its own pastel. */
const ROLE_LOOKS: Readonly<Record<ClubRole, { label: string; tone: ChipTone }>> = {
  owner: { label: 'Owner', tone: 'peach' },
  admin: { label: 'Admin', tone: 'sky' },
  member: { label: 'Member', tone: 'paper' },
};

const listLead = (output: ListClubsOutput): string => {
  if (output.clubCount === 0) return 'Nothing here yet.';
  const decks = output.clubs.reduce((total, club) => total + club.decks.length, 0);
  return `${countLabel(output.clubCount, 'club')} · ${countLabel(decks, 'shared deck')}`;
};

const clubDeckTile = (deck: DeckSummary): string =>
  deckTile(deck, {
    headingLevel: 3,
    actions: actionButton({
      label: 'Open deck',
      action: 'open',
      value: deck.url,
      variant: 'secondary',
      accessibleName: `Open ${deck.title} in Deck Club`,
    }),
  });

const clubMeta = (club: ClubSummary): string => {
  const role = ROLE_LOOKS[club.role];
  const chips = [
    chip(role.label, role.tone, `Your role: ${role.label}`),
    chip(club.visibility === 'private' ? 'Private' : 'Public', 'paper'),
    `<span>${club.memberCount} of ${countLabel(club.memberLimit, 'member')}</span>`,
    ...(club.inviteCode === null
      ? []
      : [chip(`Invite code: ${club.inviteCode}`, 'mint', `Invite code ${club.inviteCode}`)]),
  ];
  return `<p class="club-meta">${chips.join('')}</p>`;
};

/**
 * One club as a section: its name, description and the user's place in it
 * (role, members, the invite code when the role may invite), then its
 * shared decks as the same tiles the deck library shows.
 */
const clubSection = (club: ClubSummary): string => {
  const headingId = `club-${club.id}`;
  const description =
    club.description === '' ? '' : `<p class="lead">${escapeHtml(club.description)}</p>`;
  const decks =
    club.decks.length === 0
      ? '<p class="lead club-empty">No shared decks yet.</p>'
      : `<ul class="deck-grid">${club.decks.map(clubDeckTile).join('')}
      </ul>`;
  return `
    <section class="club" aria-labelledby="${headingId}">
      <h2 id="${headingId}">${escapeHtml(club.name)}</h2>
      ${description}
      ${clubMeta(club)}
      ${decks}
    </section>`;
};

/**
 * The user's clubs as the chat shows them: one section per club with the
 * user's role, the member count and, for owners and admins, the invite
 * code; then the decks the club shares, as the library's index cards.
 * @param output - the `list_clubs` result
 * @returns the HTML of the view's body
 */
export function renderClubList(output: ListClubsOutput): string {
  const header = pageHeader({ title: 'Your clubs', lead: listLead(output) });
  if (output.clubCount === 0)
    return `${header}${emptyState(
      'No clubs yet',
      'A club shares decks with a group. Create one, or join with an invite code, in Deck Club.',
      actionButton({ label: 'Open Deck Club', action: 'open', value: output.libraryUrl }),
    )}`;
  return `${header}${output.clubs.map(clubSection).join('')}
    <p class="footer">
      ${actionButton({ label: 'Open Deck Club', action: 'open', value: output.libraryUrl, variant: 'secondary' })}
    </p>`;
}
