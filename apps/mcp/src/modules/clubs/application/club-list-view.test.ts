import { describe, expect, it } from 'vitest';
import { testClub, testClubDeck } from '../testing/fake-clubs-api.js';
import { formatClubList, toClubList, toClubSummary } from './club-list-view.js';

const WEB_URL = 'https://deck.club';
const CLUB_ID = '00000000-0000-4000-8000-0000000000c1';
const BOOK_ID = '00000000-0000-4000-8000-0000000000c2';
const DECK_ID = '00000000-0000-4000-8000-0000000000d1';

describe('toClubSummary', () => {
  it('keeps what a member may see and turns each deck into a library tile with its link', () => {
    const summary = toClubSummary(
      testClub({
        id: CLUB_ID,
        name: 'Spanish Fridays',
        decks: [testClubDeck({ id: DECK_ID, title: 'Verbs' })],
      }),
      WEB_URL,
    );

    expect(summary).not.toHaveProperty('joinedAt');
    expect(summary.decks).toEqual([
      {
        id: DECK_ID,
        title: 'Verbs',
        description: '',
        language: 'es',
        cardCount: 40,
        url: `https://deck.club/decks/${DECK_ID}`,
      },
    ]);
  });
});

describe('toClubList', () => {
  it('counts the clubs and links the library', () => {
    expect(
      toClubList(
        [testClub({ id: CLUB_ID, name: 'A' }), testClub({ id: BOOK_ID, name: 'B' })],
        WEB_URL,
      ),
    ).toMatchObject({ clubCount: 2, libraryUrl: 'https://deck.club/decks' });
  });
});

describe('formatClubList', () => {
  it('writes each club with its id, the user’s role, members, the invite code and its decks', () => {
    const text = formatClubList(
      toClubList(
        [
          testClub({
            id: CLUB_ID,
            name: 'Spanish Fridays',
            description: 'We meet on Fridays.',
            decks: [testClubDeck({ id: DECK_ID, title: 'Spanish verbs', cardCount: 1 })],
          }),
        ],
        WEB_URL,
      ),
    );

    expect(text.split('\n')).toEqual([
      'The user belongs to 1 club:',
      `- "Spanish Fridays" (club id: ${CLUB_ID}, the user is owner, 12 of 100 members, private, invite code: FRIDAY-42)`,
      '  About: We meet on Fridays.',
      '  Shared decks (1):',
      `    - "Spanish verbs" (deck id: ${DECK_ID}, language: es, 1 card)`,
    ]);
  });

  it('leaves the invite code out for a member, and says when a club shares no deck', () => {
    const text = formatClubList(
      toClubList(
        [
          testClub({
            id: BOOK_ID,
            name: 'Book club',
            role: 'member',
            inviteCode: null,
            visibility: 'public',
          }),
        ],
        WEB_URL,
      ),
    );

    expect(text).toContain(
      `- "Book club" (club id: ${BOOK_ID}, the user is member, 12 of 100 members, public)`,
    );
    expect(text).toContain('  No shared decks yet.');
    expect(text).not.toContain('invite code');
  });

  it('says "2 clubs" for several', () => {
    expect(
      formatClubList(
        toClubList(
          [testClub({ id: CLUB_ID, name: 'A' }), testClub({ id: BOOK_ID, name: 'B' })],
          WEB_URL,
        ),
      ).split('\n')[0],
    ).toBe('The user belongs to 2 clubs:');
  });
});
