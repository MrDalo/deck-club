import { CLUB_LIMITS } from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import { createClubsTestKit } from '../testing/clubs-test-kit.js';

const FRIDAYS = {
  name: 'Spanish Fridays',
  description: 'We meet on Fridays.',
  visibility: 'private' as const,
};

describe('ClubService.create', () => {
  it('makes the creator the owner of a club with one member, an invite code and no decks', async () => {
    const { clubService } = createClubsTestKit();

    const club = await clubService.create('ana', FRIDAYS);

    expect(club).toEqual({
      id: expect.any(String) as string,
      name: 'Spanish Fridays',
      description: 'We meet on Fridays.',
      visibility: 'private',
      role: 'owner',
      memberCount: 1,
      memberLimit: CLUB_LIMITS.membersMax,
      inviteCode: 'CODE-0001',
      joinedAt: '2026-11-17T10:00:00.000Z',
      decks: [],
    });
  });

  it('draws another invite code when one is already taken', async () => {
    const { clubService, inviteCodes } = createClubsTestKit();
    await clubService.create('ana', FRIDAYS);
    inviteCodes.queued.push('CODE-0001');

    const second = await clubService.create('ben', { ...FRIDAYS, name: 'Book club' });

    expect(second.inviteCode).toBe('CODE-0002');
  });
});

describe('ClubService.list', () => {
  it('lists the clubs the user is in, the first joined first, with their role in each', async () => {
    const { clubService, clock } = createClubsTestKit();
    const fridays = await clubService.create('ana', FRIDAYS);
    clock.advance(1000);
    const book = await clubService.create('ben', { ...FRIDAYS, name: 'Book club' });
    clock.advance(1000);
    await clubService.join('ana', { inviteCode: book.inviteCode! });

    const clubs = await clubService.list('ana');

    expect(clubs.map((club) => [club.name, club.role, club.memberCount])).toEqual([
      ['Spanish Fridays', 'owner', 1],
      ['Book club', 'member', 2],
    ]);
    expect(clubs.map((club) => club.id)).toEqual([fridays.id, book.id]);
  });

  it('shows the invite code only to roles that may invite', async () => {
    const { clubService } = createClubsTestKit();
    const club = await clubService.create('ana', FRIDAYS);
    await clubService.join('ben', { inviteCode: club.inviteCode! });

    const [asOwner] = await clubService.list('ana');
    const [asMember] = await clubService.list('ben');

    expect(asOwner?.inviteCode).toBe('CODE-0001');
    expect(asMember?.inviteCode).toBeNull();
  });

  it('lists nothing for a user in no club, and never another user’s clubs', async () => {
    const { clubService } = createClubsTestKit();
    await clubService.create('ana', FRIDAYS);

    expect(await clubService.list('ben')).toEqual([]);
  });
});

describe('ClubService.join', () => {
  it('joins as a member with the code as people type it', async () => {
    const { clubService } = createClubsTestKit();
    const club = await clubService.create('ana', FRIDAYS);

    const joined = await clubService.join('ben', { inviteCode: ' code-0001 ' });

    expect(joined).toMatchObject({ id: club.id, role: 'member', memberCount: 2, inviteCode: null });
  });

  it('changes nothing for someone already in the club, the owner included', async () => {
    const { clubService } = createClubsTestKit();
    const club = await clubService.create('ana', FRIDAYS);

    const again = await clubService.join('ana', { inviteCode: club.inviteCode! });

    expect(again).toMatchObject({ role: 'owner', memberCount: 1 });
  });

  it('refuses an unknown invite code with CLUB_NOT_FOUND', async () => {
    const { clubService } = createClubsTestKit();

    await expect(clubService.join('ben', { inviteCode: 'NOPE-NOPE' })).rejects.toMatchObject({
      code: 'CLUB_NOT_FOUND',
    });
  });

  it('refuses a full club with CLUB_FULL', async () => {
    const { clubService, clubs } = createClubsTestKit();
    const club = await clubService.create('ana', FRIDAYS);
    for (let member = 1; member < CLUB_LIMITS.membersMax; member += 1)
      await clubService.join(`member-${member}`, { inviteCode: club.inviteCode! });

    await expect(clubService.join('late', { inviteCode: club.inviteCode! })).rejects.toMatchObject({
      code: 'CLUB_FULL',
    });
    expect(clubs.members).toHaveLength(CLUB_LIMITS.membersMax);
  });
});

describe('ClubService.shareDeck', () => {
  it('lets the owner share one of their decks, which every member then sees', async () => {
    const { clubService, seedDeck } = createClubsTestKit();
    const club = await clubService.create('ana', FRIDAYS);
    await clubService.join('ben', { inviteCode: club.inviteCode! });
    const deck = await seedDeck('ana', 'Spanish verbs', 3);

    const shared = await clubService.shareDeck('ana', club.id, { deckId: deck.id });
    const [asMember] = await clubService.list('ben');

    expect(shared.decks).toEqual([
      { id: deck.id, title: 'Spanish verbs', description: '', language: 'es', cardCount: 3 },
    ]);
    expect(asMember?.decks.map((each) => each.title)).toEqual(['Spanish verbs']);
  });

  it('shares a deck once however often it is shared', async () => {
    const { clubService, seedDeck } = createClubsTestKit();
    const club = await clubService.create('ana', FRIDAYS);
    const deck = await seedDeck('ana', 'Spanish verbs');

    await clubService.shareDeck('ana', club.id, { deckId: deck.id });
    const again = await clubService.shareDeck('ana', club.id, { deckId: deck.id });

    expect(again.decks).toHaveLength(1);
  });

  it('refuses a member with FORBIDDEN: members suggest cards instead', async () => {
    const { clubService, seedDeck } = createClubsTestKit();
    const club = await clubService.create('ana', FRIDAYS);
    await clubService.join('ben', { inviteCode: club.inviteCode! });
    const bens = await seedDeck('ben', 'Ben’s deck');

    await expect(clubService.shareDeck('ben', club.id, { deckId: bens.id })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('refuses someone outside the club with CLUB_NOT_FOUND', async () => {
    const { clubService, seedDeck } = createClubsTestKit();
    const club = await clubService.create('ana', FRIDAYS);
    const deck = await seedDeck('eve', 'Eve’s deck');

    await expect(clubService.shareDeck('eve', club.id, { deckId: deck.id })).rejects.toMatchObject({
      code: 'CLUB_NOT_FOUND',
    });
  });

  it('refuses a deck that is not the owner’s with DECK_NOT_FOUND', async () => {
    const { clubService, seedDeck } = createClubsTestKit();
    const club = await clubService.create('ana', FRIDAYS);
    const bens = await seedDeck('ben', 'Ben’s deck');

    await expect(clubService.shareDeck('ana', club.id, { deckId: bens.id })).rejects.toMatchObject({
      code: 'DECK_NOT_FOUND',
    });
  });

  it('stops listing a shared deck once its author deletes it', async () => {
    const { clubService, seedDeck, deckService } = createClubsTestKit();
    const club = await clubService.create('ana', FRIDAYS);
    const deck = await seedDeck('ana', 'Spanish verbs');
    await clubService.shareDeck('ana', club.id, { deckId: deck.id });

    await deckService.remove('ana', deck.id);

    expect((await clubService.list('ana'))[0]?.decks).toEqual([]);
  });
});
