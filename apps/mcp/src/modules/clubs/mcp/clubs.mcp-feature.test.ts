import type { Client } from '@modelcontextprotocol/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { connectFeature, testCaller, textOf } from '../../../common/mcp/testing/mcp-test-client.js';
import { ClubsService } from '../application/clubs.service.js';
import { ClubsMcpFeature } from './clubs.mcp-feature.js';

const DECK_ID = '00000000-0000-4000-8000-000000000001';
let client: Client | undefined;

async function connect(service = new ClubsService(), caller = testCaller()): Promise<Client> {
  client = await connectFeature(new ClubsMcpFeature(service), caller);
  return client;
}

afterEach(async () => {
  await client?.close();
  client = undefined;
});

describe('ClubsMcpFeature', () => {
  it('publishes the three club tools and nothing else', async () => {
    const connected = await connect();

    const { tools } = await connected.listTools();

    expect(tools.map((tool) => tool.name).sort()).toEqual([
      'create_battle',
      'list_clubs',
      'suggest_club_cards',
    ]);
    expect(connected.getServerCapabilities()?.prompts).toBeUndefined();
  });

  it('refuses every club tool when the AI connection lacks the clubs scope', async () => {
    const result = await (
      await connect(new ClubsService(), testCaller({ scopes: ['decks:read', 'study'] }))
    ).callTool({
      name: 'list_clubs',
      arguments: {},
    });

    expect(textOf(result)).toMatch(/^REJECTED: FORBIDDEN\. .*"clubs"/);
  });

  it('fills the spec 8 battle defaults before the use case runs', async () => {
    const service = new ClubsService();
    const createBattle = vi
      .spyOn(service, 'createBattle')
      .mockResolvedValue({ text: 'Join with code ABCD.' });

    await (
      await connect(service)
    ).callTool({ name: 'create_battle', arguments: { deckId: DECK_ID } });

    expect(createBattle).toHaveBeenCalledWith(expect.anything(), {
      deckId: DECK_ID,
      questionCount: 10,
      cardSelection: 'random',
      answerFormat: 'multiple_choice',
      secondsPerQuestion: 20,
      joinPolicy: 'anyone_with_code',
    });
  });

  it('rejects battle settings the spec does not offer', async () => {
    const result = await (
      await connect()
    ).callTool({
      name: 'create_battle',
      arguments: { deckId: DECK_ID, secondsPerQuestion: 45 },
    });

    expect(result.isError).toBe(true);
  });

  it('says suggest_club_cards is not built yet', async () => {
    const result = await (
      await connect()
    ).callTool({
      name: 'suggest_club_cards',
      arguments: { clubId: DECK_ID, deckId: DECK_ID, cards: [{ front: 'q', back: 'a' }] },
    });

    expect(textOf(result)).toMatch(/^REJECTED: NOT_IMPLEMENTED\. suggest_club_cards/);
  });
});
