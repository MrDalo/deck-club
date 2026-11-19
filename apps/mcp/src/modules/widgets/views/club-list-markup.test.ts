import type { ClubSummary, ListClubsOutput } from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import { renderClubList } from './club-list-markup.js';

const CLUB_ID = '00000000-0000-4000-8000-0000000000c1';
const BOOK_ID = '00000000-0000-4000-8000-0000000000c2';
const DECK_ID = '00000000-0000-4000-8000-0000000000d1';
const club = (overrides: Partial<ClubSummary> = {}): ClubSummary => ({
  id: CLUB_ID,
  name: 'Spanish Fridays',
  description: 'We meet on Fridays.',
  visibility: 'private',
  role: 'owner',
  memberCount: 12,
  memberLimit: 100,
  inviteCode: 'FRIDAY-42',
  decks: [
    {
      id: DECK_ID,
      title: 'Spanish verbs',
      description: '',
      language: 'es',
      cardCount: 40,
      url: `https://deck.club/decks/${DECK_ID}`,
    },
  ],
  ...overrides,
});
const list = (clubs: ClubSummary[] = [club()]): ListClubsOutput => ({
  clubs,
  clubCount: clubs.length,
  libraryUrl: 'https://deck.club/decks',
});

describe('renderClubList', () => {
  it('counts the clubs and their shared decks', () => {
    const html = renderClubList(
      list([club(), club({ id: BOOK_ID, name: 'Book club', decks: [] })]),
    );

    expect(html).toContain('Your clubs');
    expect(html).toContain('2 clubs · 1 shared deck');
  });

  it('gives each club a labelled section with its name and description', () => {
    const html = renderClubList(list());

    expect(html).toContain(`<section class="club" aria-labelledby="club-${CLUB_ID}">`);
    expect(html).toContain(`<h2 id="club-${CLUB_ID}">Spanish Fridays</h2>`);
    expect(html).toContain('We meet on Fridays.');
  });

  it('shows the user’s role, the visibility and how full the club is', () => {
    const html = renderClubList(list());

    expect(html).toContain(
      '<span class="chip chip-peach" aria-label="Your role: Owner">Owner</span>',
    );
    expect(html).toContain('<span class="chip chip-paper">Private</span>');
    expect(html).toContain('<span>12 of 100 members</span>');
  });

  it('shows the invite code to an owner, and none to a member', () => {
    expect(renderClubList(list())).toContain(
      '<span class="chip chip-mint" aria-label="Invite code FRIDAY-42">Invite code: FRIDAY-42</span>',
    );
    const member = renderClubList(list([club({ role: 'member', inviteCode: null })]));

    expect(member).toContain('aria-label="Your role: Member">Member</span>');
    expect(member).not.toContain('Invite code');
  });

  it('shows the shared decks as library tiles titled under the club’s heading', () => {
    const html = renderClubList(list());

    expect(html).toContain('<h3>Spanish verbs</h3>');
    expect(html).toContain('<span>40 cards</span>');
    expect(html).toContain(`data-action="open" data-value="https://deck.club/decks/${DECK_ID}"`);
    expect(html).toContain('aria-label="Open Spanish verbs in Deck Club"');
  });

  it('says when a club shares no deck yet', () => {
    const html = renderClubList(list([club({ decks: [] })]));

    expect(html).toContain('No shared decks yet.');
    expect(html).not.toContain('deck-grid');
  });

  it('says the user is in no club yet, and points to Deck Club once', () => {
    const html = renderClubList(list([]));

    expect(html).toContain('Nothing here yet.');
    expect(html).toContain('No clubs yet');
    expect(html.match(/Open Deck Club/g)).toHaveLength(1);
    expect(html).not.toContain('<section');
  });

  it('escapes club names, descriptions, invite codes and deck titles', () => {
    const html = renderClubList(
      list([
        club({
          name: '<script>x</script>',
          description: '<img src=x>',
          inviteCode: '"><svg>',
          decks: [{ ...club().decks[0]!, title: '<b>deck</b>' }],
        }),
      ]),
    );

    for (const raw of ['<script>', '<img', '<svg>', '<b>']) expect(html).not.toContain(raw);
    expect(html).toContain('&lt;script&gt;x&lt;/script&gt;');
  });
});
