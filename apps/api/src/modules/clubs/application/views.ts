import type { Club as ClubDto, Deck } from '@deck-club/contracts';
import { canInvite, type Club, type Membership } from '../domain/club.js';

/** Everything one member's view of a club is built from. */
export type ClubView = {
  club: Club;
  membership: Membership;
  memberCount: number;
  /** The club's shared decks that still exist, in the order they were shared. */
  decks: readonly Deck[];
};

/**
 * Maps a club to the contracts DTO as one member sees it (spec 9: only what
 * a member may see): their own role, the member count rather than the
 * members, and the invite code only when their role may invite.
 * @param view - the club, the caller's membership, the count and the decks
 * @returns the DTO
 */
export function toClubDto(view: ClubView): ClubDto {
  const { club, membership } = view;
  return {
    id: club.id,
    name: club.name,
    description: club.description,
    visibility: club.visibility,
    role: membership.role,
    memberCount: view.memberCount,
    memberLimit: club.memberLimit,
    inviteCode: canInvite(membership.role) ? club.inviteCode : null,
    joinedAt: membership.joinedAt.toISOString(),
    decks: view.decks.map((deck) => ({
      id: deck.id,
      title: deck.title,
      description: deck.description,
      language: deck.language,
      cardCount: deck.cardCount,
    })),
  };
}
