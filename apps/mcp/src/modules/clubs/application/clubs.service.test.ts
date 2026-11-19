import { Logger } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DeckClubError } from '../../../common/errors/deck-club-error.js';
import { testCaller } from '../../../common/mcp/testing/mcp-test-client.js';
import { createClubsService } from '../testing/clubs-test-kit.js';
import { FakeClubsApi, testClub, testClubDeck } from '../testing/fake-clubs-api.js';

const ID = '00000000-0000-4000-8000-000000000001';
const CLUB_ID = '00000000-0000-4000-8000-0000000000c1';
const DECK_ID = '00000000-0000-4000-8000-0000000000d1';
const caller = testCaller();
const FRIDAYS = testClub({
  id: CLUB_ID,
  name: 'Spanish Fridays',
  decks: [testClubDeck({ id: DECK_ID, title: 'Spanish verbs' })],
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ClubsService.listClubs', () => {
  it('answers with the user’s clubs, as text for the AI and data for its view', async () => {
    const { clubs } = createClubsService(new FakeClubsApi().withClubs('token-ana', [FRIDAYS]));

    const reply = await clubs.listClubs(caller, {});

    expect(reply.text.split('\n')[0]).toBe('The user belongs to 1 club:');
    expect(reply.text).toContain(`club id: ${CLUB_ID}`);
    expect(reply.text).toContain(`deck id: ${DECK_ID}`);
    expect(reply.structuredContent).toEqual({
      clubs: [
        {
          id: CLUB_ID,
          name: 'Spanish Fridays',
          description: '',
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
        },
      ],
      clubCount: 1,
      libraryUrl: 'https://deck.club/decks',
    });
  });

  it('asks the API as the caller, so it only ever sees that user’s clubs', async () => {
    const api = new FakeClubsApi().withClubs('token-ana', [FRIDAYS]);
    const { clubs } = createClubsService(api);

    const reply = await clubs.listClubs(testCaller({ accessToken: 'token-ben' }), {});

    expect(reply.text).not.toContain('Spanish Fridays');
    expect(api.callers.map((each) => each.accessToken)).toEqual(['token-ben']);
  });

  it('guides the AI when the user is in no club', async () => {
    const reply = await createClubsService().clubs.listClubs(caller, {});

    expect(reply.text).toBe(
      'The user is not in any club yet. A club shares decks with a group; clubs are created and joined in Deck Club with an invite code.',
    );
    expect(reply.structuredContent).toMatchObject({ clubs: [], clubCount: 0 });
  });

  it('relays the API’s refusal when it rejects the caller’s token', async () => {
    const api = new FakeClubsApi().failWith(
      new DeckClubError('UNAUTHENTICATED', 'Your session has expired. Sign in again.'),
    );

    await expect(createClubsService(api).clubs.listClubs(caller, {})).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    });
  });

  it('relays the API being unreachable instead of saying the user has no clubs', async () => {
    const api = new FakeClubsApi().failWith(
      new DeckClubError('UPSTREAM_UNAVAILABLE', 'Deck Club is not reachable right now.'),
    );

    await expect(createClubsService(api).clubs.listClubs(caller, {})).rejects.toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
    });
  });

  it('records the call by counts, never a club name or an invite code', async () => {
    const log = vi.spyOn(Logger.prototype, 'log').mockReturnValue(undefined);
    const { clubs } = createClubsService(new FakeClubsApi().withClubs('token-ana', [FRIDAYS]));

    await clubs.listClubs(caller, {});

    expect(log).toHaveBeenCalledWith({
      evt: 'clubs.listed',
      user: 'user-ana',
      clubCount: 1,
      deckCount: 1,
    });
    const logged = JSON.stringify(log.mock.calls);
    for (const secret of ['Spanish', 'FRIDAY-42']) expect(logged).not.toContain(secret);
  });
});

describe('ClubsService (interface only, not built yet)', () => {
  const { clubs } = createClubsService();

  it.each([
    [
      'suggest_club_cards',
      () => clubs.suggestClubCards(caller, { clubId: ID, deckId: ID, cards: [] }),
    ],
    [
      'create_battle',
      () =>
        clubs.createBattle(caller, {
          deckId: ID,
          questionCount: 10,
          cardSelection: 'random',
          answerFormat: 'multiple_choice',
          secondsPerQuestion: 20,
          joinPolicy: 'anyone_with_code',
        }),
    ],
  ])('%s refuses with NOT_IMPLEMENTED', async (tool, call) => {
    await expect(call()).rejects.toMatchObject({
      code: 'NOT_IMPLEMENTED',
      detail: expect.stringContaining(tool) as string,
    });
  });
});
