import type { Client } from '@modelcontextprotocol/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { connectFeature, testCaller, textOf } from '../../../common/mcp/testing/mcp-test-client.js';
import { WIDGET_URIS } from '../../../common/mcp/widgets.js';
import { StudyService } from '../application/study.service.js';
import { StudyMcpFeature } from './study.mcp-feature.js';

const DECK_ID = '00000000-0000-4000-8000-000000000001';
const CARD_ID = '00000000-0000-4000-8000-000000000002';
let client: Client | undefined;

async function connect(service = new StudyService(), caller = testCaller()): Promise<Client> {
  client = await connectFeature(new StudyMcpFeature(service), caller);
  return client;
}

afterEach(async () => {
  await client?.close();
  client = undefined;
});

describe('StudyMcpFeature tools', () => {
  it('publishes the three study tools', async () => {
    const { tools } = await (await connect()).listTools();

    expect(tools.map((tool) => tool.name).sort()).toEqual([
      'get_due_cards',
      'get_stats',
      'submit_review',
    ]);
  });

  it('links the study session and stats views', async () => {
    const { tools } = await (await connect()).listTools();
    const views = Object.fromEntries(
      tools.map((tool) => [
        tool.name,
        (tool._meta?.ui as { resourceUri?: string } | undefined)?.resourceUri,
      ]),
    );

    expect(views).toEqual({
      get_due_cards: WIDGET_URIS.studySession,
      get_stats: WIDGET_URIS.stats,
      submit_review: undefined,
    });
  });

  it('refuses a review when the AI connection lacks the study scope', async () => {
    const result = await (
      await connect(new StudyService(), testCaller({ scopes: ['decks:read'] }))
    ).callTool({
      name: 'submit_review',
      arguments: { deckId: DECK_ID, cardId: CARD_ID, rating: 'good' },
    });

    expect(textOf(result)).toMatch(/^REJECTED: FORBIDDEN\. .*"study"/);
  });

  it('rejects a rating that is not one of the four', async () => {
    const result = await (
      await connect()
    ).callTool({
      name: 'submit_review',
      arguments: { deckId: DECK_ID, cardId: CARD_ID, rating: 'perfect' },
    });

    expect(result.isError).toBe(true);
    expect(textOf(result)).not.toContain('REJECTED');
  });

  it('fills the review direction and hands the caller to the use case', async () => {
    const service = new StudyService();
    const submitReview = vi
      .spyOn(service, 'submitReview')
      .mockResolvedValue({ text: 'Next review in 3 days.' });

    const result = await (
      await connect(service)
    ).callTool({
      name: 'submit_review',
      arguments: { deckId: DECK_ID, cardId: CARD_ID, rating: 'easy' },
    });

    expect(textOf(result)).toBe('Next review in 3 days.');
    expect(submitReview).toHaveBeenCalledWith(expect.objectContaining({ clientName: 'Claude' }), {
      deckId: DECK_ID,
      cardId: CARD_ID,
      direction: 'forward',
      rating: 'easy',
    });
  });

  it('says get_due_cards is not built yet', async () => {
    const result = await (await connect()).callTool({ name: 'get_due_cards', arguments: {} });

    expect(textOf(result)).toMatch(/^REJECTED: NOT_IMPLEMENTED\. get_due_cards/);
  });
});

describe('StudyMcpFeature resource and prompts', () => {
  it('publishes the today resource as JSON', async () => {
    const { resources } = await (await connect()).listResources();

    expect(resources).toEqual([
      expect.objectContaining({ uri: 'deck-club://study/today', mimeType: 'application/json' }),
    ]);
  });

  it('publishes "Quiz me" and "Find my weak spots" with optional arguments only', async () => {
    const { prompts } = await (await connect()).listPrompts();

    expect(prompts.map((prompt) => prompt.name).sort()).toEqual(['find_weak_spots', 'quiz_me']);
    for (const prompt of prompts)
      for (const argument of prompt.arguments ?? []) expect(argument.required).toBeFalsy();
  });

  it('refuses a count that is not a number before reaching the use case', async () => {
    const service = new StudyService();
    const quizMe = vi.spyOn(service, 'quizMePrompt');

    await expect(
      (await connect(service)).getPrompt({ name: 'quiz_me', arguments: { count: 'ten' } }),
    ).rejects.toThrow();
    expect(quizMe).not.toHaveBeenCalled();
  });

  it('refuses the prompts while they are not built yet', async () => {
    await expect(
      (await connect()).getPrompt({ name: 'find_weak_spots', arguments: {} }),
    ).rejects.toThrow(/REJECTED: NOT_IMPLEMENTED/);
  });
});
