import type { Club, Membership, SharedDeck } from '../../domain/club.js';

/** Port: clubs, their members and the decks they share. Owned by the clubs module only. */
export type ClubRepository = {
  /** Saves a new club and its owner's membership, both or neither. */
  insert(club: Club, owner: Membership): Promise<void>;
  findByInviteCode(inviteCode: string): Promise<Club | null>;
  listByIds(clubIds: readonly string[]): Promise<Club[]>;
  /** The user's memberships, the oldest first. */
  listMemberships(userId: string): Promise<Membership[]>;
  findMembership(clubId: string, userId: string): Promise<Membership | null>;
  /** How many members each of these clubs has. */
  countMembers(clubIds: readonly string[]): Promise<Map<string, number>>;
  /**
   * Adds a member unless the club already has `limit` members, in one step,
   * so two people joining at once cannot both take the last place.
   * @returns false when the club is full
   */
  addMemberIfRoom(membership: Membership, limit: number): Promise<boolean>;
  /** The decks these clubs share, the first shared first. */
  listSharedDecks(clubIds: readonly string[]): Promise<SharedDeck[]>;
  /** Shares a deck with a club; sharing it again changes nothing. */
  shareDeck(shared: SharedDeck): Promise<void>;
};

/** Nest injection token for {@link ClubRepository}. */
export const CLUB_REPOSITORY = Symbol('CLUB_REPOSITORY');
