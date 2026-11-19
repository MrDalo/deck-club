import {
  type Club,
  CLUB_LIMITS,
  type ClubList,
  ClubListSchema,
  type Deck,
  IDEMPOTENCY_KEY_HEADER,
  type ProblemDetails,
} from '@deck-club/contracts';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, signedInAs } from './test-app.js';

let app: NestFastifyApplication;

beforeEach(async () => {
  app = await createTestApp();
});

afterEach(async () => {
  await app.close();
});

const post = (
  userId: string,
  url: string,
  payload: Record<string, unknown>,
  headers: Record<string, string> = {},
) => app.inject({ method: 'POST', url, headers: { ...signedInAs(userId), ...headers }, payload });

const listClubs = async (userId: string): Promise<ClubList> =>
  (
    await app.inject({ method: 'GET', url: '/clubs', headers: signedInAs(userId) })
  ).json<ClubList>();

async function createClub(userId: string, name = 'Spanish Fridays'): Promise<Club> {
  const response = await post(userId, '/clubs', { name });
  expect(response.statusCode).toBe(201);
  return response.json<Club>();
}

async function createDeck(userId: string, title: string): Promise<Deck> {
  return (await post(userId, '/decks', { title, language: 'es' })).json<Deck>();
}

describe('clubs over HTTP, on real SQLite', () => {
  it('requires a signed-in user', async () => {
    const response = await app.inject({ method: 'GET', url: '/clubs' });

    expect(response.json<ProblemDetails>().code).toBe('UNAUTHENTICATED');
  });

  it('creates a club, shares a deck, lets a member join and lists it to the contract', async () => {
    const club = await createClub('ana');
    const deck = await createDeck('ana', 'Spanish verbs');
    await post('ana', `/decks/${deck.id}/cards/batch`, {
      cards: [
        { front: 'hablar', back: 'to speak' },
        { front: 'comer', back: 'to eat' },
      ],
    });

    const shared = await post('ana', `/clubs/${club.id}/decks`, { deckId: deck.id });
    const joined = await post('ben', '/clubs/join', { inviteCode: club.inviteCode!.toLowerCase() });
    const asBen = await listClubs('ben');
    const asAna = await listClubs('ana');

    expect(shared.statusCode).toBe(200);
    expect(joined.statusCode).toBe(200);
    expect(ClubListSchema.safeParse(asBen).success).toBe(true);
    expect(asBen.clubs).toEqual([
      expect.objectContaining({
        id: club.id,
        role: 'member',
        memberCount: 2,
        inviteCode: null,
        decks: [
          { id: deck.id, title: 'Spanish verbs', description: '', language: 'es', cardCount: 2 },
        ],
      }),
    ]);
    expect(asAna.clubs[0]).toMatchObject({ role: 'owner', inviteCode: club.inviteCode });
    expect(club.inviteCode).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    expect((await listClubs('eve')).clubs).toEqual([]);
  });

  it('creates a retried club once when it carries the same idempotency key', async () => {
    const headers = { [IDEMPOTENCY_KEY_HEADER]: 'club-create-1' };

    const first = await post('ana', '/clubs', { name: 'Spanish Fridays' }, headers);
    const retry = await post('ana', '/clubs', { name: 'Spanish Fridays' }, headers);

    expect(retry.json<Club>().id).toBe(first.json<Club>().id);
    expect((await listClubs('ana')).clubs).toHaveLength(1);
  });

  it('rejects a club without a name with VALIDATION_FAILED', async () => {
    const response = await post('ana', '/clubs', { name: '   ' });

    expect(response.json<ProblemDetails>()).toMatchObject({
      status: 400,
      code: 'VALIDATION_FAILED',
      issues: [expect.objectContaining({ path: 'name' })],
    });
  });

  it('refuses an unknown invite code with CLUB_NOT_FOUND', async () => {
    const response = await post('ben', '/clubs/join', { inviteCode: 'NOPE-NOPE' });

    expect(response.json<ProblemDetails>()).toMatchObject({ status: 404, code: 'CLUB_NOT_FOUND' });
  });

  it('refuses a member sharing a deck with FORBIDDEN, and an outsider with CLUB_NOT_FOUND', async () => {
    const club = await createClub('ana');
    await post('ben', '/clubs/join', { inviteCode: club.inviteCode });
    const bens = await createDeck('ben', 'Ben’s deck');
    const eves = await createDeck('eve', 'Eve’s deck');

    const asMember = await post('ben', `/clubs/${club.id}/decks`, { deckId: bens.id });
    const asOutsider = await post('eve', `/clubs/${club.id}/decks`, { deckId: eves.id });
    const badId = await post('ana', '/clubs/not-a-uuid/decks', { deckId: bens.id });

    expect(asMember.json<ProblemDetails>()).toMatchObject({ status: 403, code: 'FORBIDDEN' });
    expect(asOutsider.json<ProblemDetails>()).toMatchObject({
      status: 404,
      code: 'CLUB_NOT_FOUND',
    });
    expect(badId.json<ProblemDetails>().code).toBe('CLUB_NOT_FOUND');
  });

  it('refuses sharing someone else’s deck with DECK_NOT_FOUND', async () => {
    const club = await createClub('ana');
    const bens = await createDeck('ben', 'Ben’s deck');

    const response = await post('ana', `/clubs/${club.id}/decks`, { deckId: bens.id });

    expect(response.json<ProblemDetails>()).toMatchObject({ status: 404, code: 'DECK_NOT_FOUND' });
  });

  it('stops listing a shared deck once its author deletes it', async () => {
    const club = await createClub('ana');
    const deck = await createDeck('ana', 'Spanish verbs');
    await post('ana', `/clubs/${club.id}/decks`, { deckId: deck.id });

    await app.inject({ method: 'DELETE', url: `/decks/${deck.id}`, headers: signedInAs('ana') });

    expect((await listClubs('ana')).clubs[0]?.decks).toEqual([]);
  });

  it('refuses the 101st member with CLUB_FULL', async () => {
    const club = await createClub('ana');
    for (let member = 1; member < CLUB_LIMITS.membersMax; member += 1)
      await post(`member-${member}`, '/clubs/join', { inviteCode: club.inviteCode });

    const late = await post('late', '/clubs/join', { inviteCode: club.inviteCode });

    expect(late.json<ProblemDetails>()).toMatchObject({ status: 409, code: 'CLUB_FULL' });
    expect((await listClubs('ana')).clubs[0]?.memberCount).toBe(CLUB_LIMITS.membersMax);
  });
});
