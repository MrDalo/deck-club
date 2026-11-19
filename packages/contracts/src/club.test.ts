import { describe, expect, it } from 'vitest';
import {
  CLUB_LIMITS,
  ClubListSchema,
  ClubSchema,
  CreateClubInputSchema,
  JoinClubInputSchema,
  ShareClubDeckInputSchema,
} from './club.js';

const club = {
  id: '00000000-0000-4000-8000-0000000000c1',
  name: 'Spanish Fridays',
  description: 'We meet on Fridays.',
  visibility: 'private',
  role: 'owner',
  memberCount: 12,
  memberLimit: CLUB_LIMITS.membersMax,
  inviteCode: 'FRIDAY-42',
  joinedAt: '2026-11-01T10:00:00.000Z',
  decks: [
    {
      id: '00000000-0000-4000-8000-000000000001',
      title: 'Spanish verbs',
      description: '',
      language: 'es',
      cardCount: 40,
    },
  ],
};

describe('ClubSchema', () => {
  it('accepts a club with the caller’s role and its shared decks', () => {
    expect(ClubSchema.parse(club)).toEqual(club);
  });

  it('accepts a member who may not see the invite code', () => {
    expect(ClubSchema.safeParse({ ...club, role: 'member', inviteCode: null }).success).toBe(true);
  });

  it('rejects a role the spec does not have', () => {
    expect(ClubSchema.safeParse({ ...club, role: 'moderator' }).success).toBe(false);
  });

  it('rejects more members than a club may hold in v1', () => {
    expect(ClubSchema.safeParse({ ...club, memberCount: 101 }).success).toBe(false);
  });

  it('rejects a club without its caller, which no member list can have', () => {
    expect(ClubSchema.safeParse({ ...club, memberCount: 0 }).success).toBe(false);
  });
});

describe('ClubListSchema', () => {
  it('accepts a caller in no club', () => {
    expect(ClubListSchema.parse({ clubs: [] })).toEqual({ clubs: [] });
  });
});

describe('CreateClubInputSchema', () => {
  it('creates a private club without a description unless told otherwise', () => {
    expect(CreateClubInputSchema.parse({ name: '  Spanish Fridays ' })).toEqual({
      name: 'Spanish Fridays',
      description: '',
      visibility: 'private',
    });
  });

  it('rejects a blank name, a name too long and markup', () => {
    for (const name of ['  ', 'x'.repeat(CLUB_LIMITS.name.max + 1), '<b>Club</b>'])
      expect(CreateClubInputSchema.safeParse({ name }).success).toBe(false);
  });
});

describe('JoinClubInputSchema', () => {
  it('accepts an invite code as people type it', () => {
    expect(JoinClubInputSchema.parse({ inviteCode: ' k7qp-m2xd ' })).toEqual({
      inviteCode: 'k7qp-m2xd',
    });
  });

  it('rejects anything that cannot be an invite code', () => {
    for (const inviteCode of ['', 'ab', 'K7QP;DROP', 'x'.repeat(21)])
      expect(JoinClubInputSchema.safeParse({ inviteCode }).success).toBe(false);
  });
});

describe('ShareClubDeckInputSchema', () => {
  it('takes a deck id', () => {
    expect(ShareClubDeckInputSchema.safeParse({ deckId: 'not-a-uuid' }).success).toBe(false);
  });
});
