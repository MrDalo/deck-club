import { describe, expect, it } from 'vitest';
import { testCaller } from '../../../common/mcp/testing/mcp-test-client.js';
import { StudyService } from './study.service.js';

const DECK_ID = '00000000-0000-4000-8000-000000000001';
const caller = testCaller();
const study = new StudyService();

describe('StudyService (interface only, not built yet)', () => {
  it.each([
    ['get_due_cards', () => study.getDueCards(caller, { limit: 10 })],
    [
      'submit_review',
      () =>
        study.submitReview(caller, {
          deckId: DECK_ID,
          cardId: DECK_ID,
          direction: 'forward',
          rating: 'good',
        }),
    ],
    ['get_stats', () => study.getStats(caller, {})],
    ['today resource', () => study.readToday(caller)],
    ['Quiz me', () => study.quizMePrompt({})],
    ['Find my weak spots', () => study.findWeakSpotsPrompt({})],
  ])('%s refuses with NOT_IMPLEMENTED', async (capability, call) => {
    await expect(call()).rejects.toMatchObject({
      code: 'NOT_IMPLEMENTED',
      detail: expect.stringContaining(capability) as string,
    });
  });
});
