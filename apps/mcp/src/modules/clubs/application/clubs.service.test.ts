import { describe, expect, it } from 'vitest';
import { testCaller } from '../../../common/mcp/testing/mcp-test-client.js';
import { ClubsService } from './clubs.service.js';

const ID = '00000000-0000-4000-8000-000000000001';
const caller = testCaller();
const clubs = new ClubsService();

describe('ClubsService (interface only, not built yet)', () => {
  it.each([
    ['list_clubs', () => clubs.listClubs(caller, {})],
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
