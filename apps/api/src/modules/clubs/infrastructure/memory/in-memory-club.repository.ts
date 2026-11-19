import type { ClubRepository } from '../../application/ports/club-repository.js';
import type { Club, Membership, SharedDeck } from '../../domain/club.js';

const byTime =
  <Item>(time: (item: Item) => Date) =>
  (first: Item, second: Item) =>
    time(first).getTime() - time(second).getTime();

/**
 * Test adapter for {@link ClubRepository}. Use-case tests use it; never mock
 * a port ad hoc (rule 40-tests).
 */
export class InMemoryClubRepository implements ClubRepository {
  readonly clubs = new Map<string, Club>();
  readonly members: Membership[] = [];
  readonly shared: SharedDeck[] = [];

  insert(club: Club, owner: Membership): Promise<void> {
    this.clubs.set(club.id, club);
    this.members.push(owner);
    return Promise.resolve();
  }

  findByInviteCode(inviteCode: string): Promise<Club | null> {
    return Promise.resolve(
      [...this.clubs.values()].find((club) => club.inviteCode === inviteCode) ?? null,
    );
  }

  listByIds(clubIds: readonly string[]): Promise<Club[]> {
    return Promise.resolve(
      clubIds.flatMap((clubId) => {
        const club = this.clubs.get(clubId);
        return club === undefined ? [] : [club];
      }),
    );
  }

  listMemberships(userId: string): Promise<Membership[]> {
    return Promise.resolve(
      this.members
        .filter((membership) => membership.userId === userId)
        .sort(byTime((membership) => membership.joinedAt)),
    );
  }

  findMembership(clubId: string, userId: string): Promise<Membership | null> {
    return Promise.resolve(
      this.members.find((each) => each.clubId === clubId && each.userId === userId) ?? null,
    );
  }

  countMembers(clubIds: readonly string[]): Promise<Map<string, number>> {
    return Promise.resolve(
      new Map(
        clubIds.map((clubId) => [
          clubId,
          this.members.filter((membership) => membership.clubId === clubId).length,
        ]),
      ),
    );
  }

  async addMemberIfRoom(membership: Membership, limit: number): Promise<boolean> {
    const members = (await this.countMembers([membership.clubId])).get(membership.clubId) ?? 0;
    if (members >= limit) return false;
    this.members.push(membership);
    return true;
  }

  listSharedDecks(clubIds: readonly string[]): Promise<SharedDeck[]> {
    return Promise.resolve(
      this.shared
        .filter((link) => clubIds.includes(link.clubId))
        .sort(byTime((link) => link.sharedAt)),
    );
  }

  shareDeck(shared: SharedDeck): Promise<void> {
    const already = this.shared.some(
      (link) => link.clubId === shared.clubId && link.deckId === shared.deckId,
    );
    if (!already) this.shared.push(shared);
    return Promise.resolve();
  }
}
