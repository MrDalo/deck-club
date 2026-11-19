import { CLUB_LIMITS } from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import { canInvite, canShareDecks, createClub, memberOf } from './club.js';

const NOW = new Date('2026-11-17T10:00:00Z');
const created = createClub({
  id: 'club-1',
  ownerId: 'ana',
  command: { name: 'Spanish Fridays', description: '', visibility: 'private' },
  inviteCode: 'K7QP-M2XD',
  now: NOW,
});

describe('createClub', () => {
  it('makes the creator its owner, with the v1 member limit', () => {
    expect(created.owner).toEqual({
      clubId: 'club-1',
      userId: 'ana',
      role: 'owner',
      joinedAt: NOW,
    });
    expect(created.club).toMatchObject({
      name: 'Spanish Fridays',
      inviteCode: 'K7QP-M2XD',
      memberLimit: CLUB_LIMITS.membersMax,
      createdBy: 'ana',
    });
  });
});

describe('memberOf', () => {
  it('joins someone with the invite code as a member', () => {
    expect(memberOf(created.club, 'ben', NOW)).toEqual({
      clubId: 'club-1',
      userId: 'ben',
      role: 'member',
      joinedAt: NOW,
    });
  });
});

describe('roles', () => {
  it.each([
    ['owner', true],
    ['admin', true],
    ['member', false],
  ] as const)('%s may invite and share decks: %s', (role, allowed) => {
    expect(canInvite(role)).toBe(allowed);
    expect(canShareDecks(role)).toBe(allowed);
  });
});
