import {
  CLUB_LIMITS,
  type ClubRole,
  type ClubVisibility,
  type CreateClubCommand,
} from '@deck-club/contracts';

/** A group that studies together (spec 3, 7). */
export type Club = {
  id: string;
  name: string;
  description: string;
  visibility: ClubVisibility;
  /** Stored grouped, e.g. `K7QP-M2XD`; unique across clubs. */
  inviteCode: string;
  memberLimit: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

/** A user's place in a club (spec 3, "Membership"). */
export type Membership = {
  clubId: string;
  userId: string;
  role: ClubRole;
  joinedAt: Date;
};

/**
 * A deck a club shares. The deck stays its author's: the club links to it
 * (ADR 0010), so there is no foreign key into the decks module (rule 25-data).
 */
export type SharedDeck = {
  clubId: string;
  deckId: string;
  sharedBy: string;
  sharedAt: Date;
};

/** What is needed to create a club besides the validated command. */
export type NewClub = {
  id: string;
  ownerId: string;
  command: CreateClubCommand;
  inviteCode: string;
  now: Date;
};

/**
 * Creates a club with its creator as owner (spec 4.6), holding up to the v1
 * member limit.
 * @param input - the new id, the creator, the validated command, the invite code and the time
 * @returns the club and the owner's membership
 */
export function createClub(input: NewClub): { club: Club; owner: Membership } {
  return {
    club: {
      id: input.id,
      name: input.command.name,
      description: input.command.description,
      visibility: input.command.visibility,
      inviteCode: input.inviteCode,
      memberLimit: CLUB_LIMITS.membersMax,
      createdBy: input.ownerId,
      createdAt: input.now,
      updatedAt: input.now,
    },
    owner: { clubId: input.id, userId: input.ownerId, role: 'owner', joinedAt: input.now },
  };
}

/**
 * Someone who joins with the invite code joins as a member (spec 7).
 * @param club - the club
 * @param userId - who joins
 * @param now - when
 * @returns the membership
 */
export function memberOf(club: Club, userId: string, now: Date): Membership {
  return { clubId: club.id, userId, role: 'member', joinedAt: now };
}

/** Roles that run the club: they may invite people and share decks (spec 7, roles table). */
const MANAGING_ROLES: readonly ClubRole[] = ['owner', 'admin'];

/**
 * Whether a role may see and hand out the invite code.
 * @param role - the member's role
 * @returns true for owners and admins
 */
export function canInvite(role: ClubRole): boolean {
  return MANAGING_ROLES.includes(role);
}

/**
 * Whether a role may share decks with the club ("Add or edit cards
 * directly": owners and admins; members suggest cards instead, spec 7).
 * @param role - the member's role
 * @returns true for owners and admins
 */
export function canShareDecks(role: ClubRole): boolean {
  return MANAGING_ROLES.includes(role);
}
