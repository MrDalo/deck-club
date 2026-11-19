import type { Client } from '@modelcontextprotocol/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { connectFeature, testCaller, textOf } from '../../../common/mcp/testing/mcp-test-client.js';
import { WIDGET_URIS } from '../../../common/mcp/widgets.js';
import type { ClubsService } from '../application/clubs.service.js';
import { createClubsService } from '../testing/clubs-test-kit.js';
import { FakeClubsApi, testClub, testClubDeck } from '../testing/fake-clubs-api.js';
import { ClubsMcpFeature } from './clubs.mcp-feature.js';

const DECK_ID = '00000000-0000-4000-8000-000000000001';
let client: Client | undefined;

const serviceOver = (api = new FakeClubsApi()): ClubsService => createClubsService(api).clubs;

async function connect(service = serviceOver(), caller = testCaller()): Promise<Client> {
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
    const api = new FakeClubsApi();
    const result = await (
      await connect(serviceOver(api), testCaller({ scopes: ['decks:read', 'study'] }))
    ).callTool({
      name: 'list_clubs',
      arguments: {},
    });

    expect(textOf(result)).toMatch(/^REJECTED: FORBIDDEN\. .*"clubs"/);
    expect(api.callers).toEqual([]);
  });

  it('links the club list view and declares the shape it renders', async () => {
    const { tools } = await (await connect()).listTools();
    const listClubs = tools.find((tool) => tool.name === 'list_clubs');

    expect((listClubs?._meta?.ui as { resourceUri?: string } | undefined)?.resourceUri).toBe(
      WIDGET_URIS.clubList,
    );
    expect(listClubs?.outputSchema).toMatchObject({
      type: 'object',
      required: expect.arrayContaining(['clubs', 'clubCount', 'libraryUrl']) as string[],
    });
    expect(listClubs?.annotations).toMatchObject({ readOnlyHint: true });
  });

  it('lists the user’s clubs for the model and, validated, for the view', async () => {
    const api = new FakeClubsApi().withClubs('token-ana', [
      testClub({
        id: DECK_ID,
        name: 'Spanish Fridays',
        decks: [testClubDeck({ id: DECK_ID, title: 'Spanish verbs' })],
      }),
    ]);

    const result = await (
      await connect(serviceOver(api))
    ).callTool({
      name: 'list_clubs',
      arguments: {},
    });

    expect(result.isError).toBeFalsy();
    expect(textOf(result)).toMatch(/^The user belongs to 1 club:/);
    expect(result.structuredContent).toMatchObject({
      clubCount: 1,
      clubs: [{ name: 'Spanish Fridays', role: 'owner', decks: [{ title: 'Spanish verbs' }] }],
    });
  });

  it('fills the spec 8 battle defaults before the use case runs', async () => {
    const service = serviceOver();
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
