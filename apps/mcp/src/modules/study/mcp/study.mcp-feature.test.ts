import type { Client } from '@modelcontextprotocol/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { connectFeature, testCaller, textOf } from '../../../common/mcp/testing/mcp-test-client.js';
import { WIDGET_URIS } from '../../../common/mcp/widgets.js';
import type { StudyService } from '../application/study.service.js';
import {
  FakeStudyApi,
  STUDY_DECK_ID,
  testDueCard,
  testStudyDeck,
  testWeakCard,
} from '../testing/fake-study-api.js';
import { createStudyService } from '../testing/study-test-kit.js';
import { StudyMcpFeature } from './study.mcp-feature.js';

const DECK_ID = '00000000-0000-4000-8000-000000000001';
const CARD_ID = '00000000-0000-4000-8000-000000000002';
let client: Client | undefined;

const serviceOver = (api = new FakeStudyApi()): StudyService => createStudyService(api).study;

async function connect(service = serviceOver(), caller = testCaller()): Promise<Client> {
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
    const api = new FakeStudyApi();
    const result = await (
      await connect(serviceOver(api), testCaller({ scopes: ['decks:read'] }))
    ).callTool({
      name: 'submit_review',
      arguments: { deckId: DECK_ID, cardId: CARD_ID, rating: 'good' },
    });

    expect(textOf(result)).toMatch(/^REJECTED: FORBIDDEN\. .*"study"/);
    expect(api.reviews).toEqual([]);
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
    const service = serviceOver();
    const submitReview = vi.spyOn(service, 'submitReview').mockResolvedValue({
      text: 'Next review in 3 days.',
      structuredContent: {
        reviewId: '00000000-0000-4000-8000-000000000003',
        deckId: DECK_ID,
        cardId: CARD_ID,
        direction: 'forward',
        rating: 'easy',
        state: 'review',
        nextDueAt: '2026-11-20T10:00:00.000Z',
        replayed: false,
        asOf: '2026-11-17T10:00:00.000Z',
      },
    });

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

  it('declares the shape of the review the study session view reads back', async () => {
    const { tools } = await (await connect()).listTools();
    const submitReview = tools.find((tool) => tool.name === 'submit_review');

    expect(submitReview?.outputSchema).toMatchObject({
      type: 'object',
      required: expect.arrayContaining([
        'deckId',
        'cardId',
        'rating',
        'nextDueAt',
        'replayed',
      ]) as string[],
    });
    expect(submitReview?.inputSchema.properties).toHaveProperty('idempotencyKey');
    expect(submitReview?.annotations).toMatchObject({
      readOnlyHint: false,
      destructiveHint: false,
    });
  });

  it('records a rating for the model and, validated, for the view', async () => {
    const api = new FakeStudyApi()
      .withDecks('token-ana', [testStudyDeck()])
      .withDueCards('token-ana', [testDueCard({ cardId: CARD_ID })]);

    const result = await (
      await connect(serviceOver(api))
    ).callTool({
      name: 'submit_review',
      arguments: {
        deckId: STUDY_DECK_ID,
        cardId: CARD_ID,
        rating: 'good',
        idempotencyKey: 'review-key-1',
      },
    });

    expect(result.isError).toBeFalsy();
    expect(textOf(result)).toMatch(/^Recorded "good" for card/);
    expect(result.structuredContent).toMatchObject({
      deckId: STUDY_DECK_ID,
      cardId: CARD_ID,
      rating: 'good',
      state: 'review',
      replayed: false,
    });
    expect(api.idempotencyKeys).toEqual(['review-key-1']);
  });

  it('relays DIRECTION_NOT_STUDIED as a tool result the AI can read', async () => {
    const api = new FakeStudyApi()
      .withDecks('token-ana', [testStudyDeck()])
      .withDueCards('token-ana', [testDueCard({ cardId: CARD_ID })]);

    const result = await (
      await connect(serviceOver(api))
    ).callTool({
      name: 'submit_review',
      arguments: { deckId: STUDY_DECK_ID, cardId: CARD_ID, direction: 'reverse', rating: 'good' },
    });

    expect(textOf(result)).toBe(
      'REJECTED: DIRECTION_NOT_STUDIED. Only reversible cards are studied in the reverse direction.',
    );
  });

  it('rejects an idempotencyKey outside the safe set before anything is recorded', async () => {
    const api = new FakeStudyApi();

    const result = await (
      await connect(serviceOver(api))
    ).callTool({
      name: 'submit_review',
      arguments: {
        deckId: DECK_ID,
        cardId: CARD_ID,
        rating: 'good',
        idempotencyKey: 'a b c d e f',
      },
    });

    expect(result.isError).toBe(true);
    expect(api.reviews).toEqual([]);
  });

  it('declares the shape of the due cards its study session view renders', async () => {
    const { tools } = await (await connect()).listTools();
    const getDueCards = tools.find((tool) => tool.name === 'get_due_cards');

    expect(getDueCards?.outputSchema).toMatchObject({
      type: 'object',
      required: expect.arrayContaining(['deck', 'cards', 'totalDue', 'libraryUrl']) as string[],
    });
    expect(getDueCards?.annotations).toMatchObject({ readOnlyHint: true });
  });

  it('returns the due cards for the model and, validated, for the view', async () => {
    const api = new FakeStudyApi()
      .withDecks('token-ana', [testStudyDeck()])
      .withDueCards('token-ana', [
        testDueCard({ cardId: CARD_ID }),
        testDueCard({ cardId: DECK_ID, prompt: 'comer', answer: 'to eat' }),
      ]);

    const result = await (
      await connect(serviceOver(api))
    ).callTool({ name: 'get_due_cards', arguments: { deckId: STUDY_DECK_ID, limit: 1 } });

    expect(result.isError).toBeFalsy();
    expect(textOf(result)).toMatch(/^2 cards are due now in "Spanish verbs"; here are the first 1/);
    expect(result.structuredContent).toMatchObject({
      deck: { id: STUDY_DECK_ID, title: 'Spanish verbs' },
      cards: [{ cardId: CARD_ID, prompt: 'hablar', answer: 'to speak' }],
      totalDue: 2,
    });
    expect(api.dueRequests).toEqual([{ deckId: STUDY_DECK_ID, limit: 1 }]);
  });

  it('asks the API for ten cards from every deck when the AI gives no arguments', async () => {
    const api = new FakeStudyApi();

    await (await connect(serviceOver(api))).callTool({ name: 'get_due_cards', arguments: {} });

    expect(api.dueRequests).toEqual([{ deckId: undefined, limit: 10 }]);
  });

  it('refuses due cards when the AI connection lacks the study scope, before asking the API', async () => {
    const api = new FakeStudyApi();

    const result = await (
      await connect(serviceOver(api), testCaller({ scopes: ['decks:read', 'decks:write'] }))
    ).callTool({ name: 'get_due_cards', arguments: {} });

    expect(textOf(result)).toMatch(/^REJECTED: FORBIDDEN\. .*"study"/);
    expect(api.dueRequests).toEqual([]);
  });

  it('relays DECK_NOT_FOUND for another user’s deck as a tool result', async () => {
    const result = await (
      await connect()
    ).callTool({ name: 'get_due_cards', arguments: { deckId: STUDY_DECK_ID } });

    expect(result.isError).toBe(true);
    expect(textOf(result)).toBe(
      'REJECTED: DECK_NOT_FOUND. No deck with that id exists in your library.',
    );
  });

  it('rejects a limit above 50 before it reaches the use case', async () => {
    const api = new FakeStudyApi();

    const result = await (
      await connect(serviceOver(api))
    ).callTool({ name: 'get_due_cards', arguments: { limit: 51 } });

    expect(result.isError).toBe(true);
    expect(api.dueRequests).toEqual([]);
  });

  it('declares the shape of the stats its view renders', async () => {
    const { tools } = await (await connect()).listTools();
    const getStats = tools.find((tool) => tool.name === 'get_stats');

    expect(getStats?.outputSchema).toMatchObject({
      type: 'object',
      required: expect.arrayContaining([
        'streakDays',
        'retention30d',
        'weakCards',
        'dueToday',
        'decksDueToday',
      ]) as string[],
    });
    expect(getStats?.annotations).toMatchObject({ readOnlyHint: true });
  });

  it('returns the stats for the model and, validated, for the view', async () => {
    const api = new FakeStudyApi()
      .withStats('token-ana', {
        streakDays: 2,
        reviewedToday: 3,
        totalReviews: 40,
        retention30d: 0.75,
        weakCards: [testWeakCard({ cardId: CARD_ID })],
      })
      .withToday('token-ana', {
        decks: [{ deckId: STUDY_DECK_ID, title: 'Spanish verbs', dueReviews: 1, newCards: 0 }],
        totals: { dueReviews: 1, newCards: 0 },
      });

    const result = await (
      await connect(serviceOver(api))
    ).callTool({ name: 'get_stats', arguments: {} });

    expect(result.isError).toBeFalsy();
    expect(textOf(result)).toMatch(/^Streak: 2 days in a row, including today\./);
    expect(result.structuredContent).toMatchObject({
      retention30d: 0.75,
      weakCards: [{ cardId: CARD_ID, forgotten: 3 }],
      decksDueToday: [{ id: STUDY_DECK_ID, dueReviews: 1 }],
    });
  });

  it('refuses the stats when the AI connection lacks the study scope', async () => {
    const api = new FakeStudyApi();

    const result = await (
      await connect(serviceOver(api), testCaller({ scopes: ['decks:read'] }))
    ).callTool({ name: 'get_stats', arguments: {} });

    expect(textOf(result)).toMatch(/^REJECTED: FORBIDDEN\. .*"study"/);
    expect(api.callers).toEqual([]);
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
    const service = serviceOver();
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
