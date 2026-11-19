import { Inject, Injectable } from '@nestjs/common';
import type {
  Club as ClubDto,
  CreateClubCommand,
  JoinClubInput,
  ShareClubDeckInput,
} from '@deck-club/contracts';
import { AppError } from '../../../common/errors/app-error.js';
import { TIME_AND_IDS, type TimeAndIds } from '../../../common/time-and-ids.js';
import { DecksFacade } from '../../decks/decks.facade.js';
import { canShareDecks, createClub, memberOf, type Membership } from '../domain/club.js';
import { normalizeInviteCode } from '../domain/invite-code.js';
import { inviteCodeNotFound, loadMembership } from './club-access.js';
import { CLUB_REPOSITORY, type ClubRepository } from './ports/club-repository.js';
import { INVITE_CODES, type InviteCodes } from './ports/invite-codes.js';
import { toClubDto } from './views.js';

/** Tries before giving up on a free invite code; 32^8 codes make even one clash rare. */
const INVITE_CODE_ATTEMPTS = 5;

/**
 * Club use cases (spec 4.6, 7): list the caller's clubs, create one, join
 * one with its invite code, share a deck with it. Decks are read only
 * through DecksFacade; the clubs module never touches the decks' tables.
 */
@Injectable()
export class ClubService {
  constructor(
    @Inject(CLUB_REPOSITORY) private readonly clubs: ClubRepository,
    @Inject(DecksFacade) private readonly decks: DecksFacade,
    @Inject(TIME_AND_IDS) private readonly runtime: TimeAndIds,
    @Inject(INVITE_CODES) private readonly inviteCodes: InviteCodes,
  ) {}

  /** The clubs the user belongs to, the first joined first, as they see each one. */
  async list(userId: string): Promise<ClubDto[]> {
    return this.viewsOf(await this.clubs.listMemberships(userId));
  }

  /** Creates a club with the user as its owner (spec 4.6). */
  async create(userId: string, command: CreateClubCommand): Promise<ClubDto> {
    const { club, owner } = createClub({
      id: this.runtime.ids.next(),
      ownerId: userId,
      command,
      inviteCode: await this.freeInviteCode(),
      now: this.runtime.clock.now(),
    });
    await this.clubs.insert(club, owner);
    return toClubDto({ club, membership: owner, memberCount: 1, decks: [] });
  }

  /**
   * Joins a club with its invite code, as a member. Joining a club one is
   * already in changes nothing and answers with the club.
   * @throws AppError CLUB_NOT_FOUND for an unknown code, CLUB_FULL when the club has no room left
   */
  async join(userId: string, input: JoinClubInput): Promise<ClubDto> {
    const club = await this.clubs.findByInviteCode(normalizeInviteCode(input.inviteCode));
    if (club === null) throw inviteCodeNotFound();
    const existing = await this.clubs.findMembership(club.id, userId);
    if (existing !== null) return this.viewOf(existing);
    const membership = memberOf(club, userId, this.runtime.clock.now());
    if (!(await this.clubs.addMemberIfRoom(membership, club.memberLimit)))
      throw new AppError(
        'CLUB_FULL',
        `This club is full: it already has ${club.memberLimit} members, the most a club can have.`,
      );
    return this.viewOf(membership);
  }

  /**
   * Shares one of the user's own decks with a club they run. Sharing it
   * again changes nothing.
   * @throws AppError CLUB_NOT_FOUND when the user is not in the club, FORBIDDEN for a member, DECK_NOT_FOUND for a deck that is not theirs
   */
  async shareDeck(userId: string, clubId: string, input: ShareClubDeckInput): Promise<ClubDto> {
    const membership = await loadMembership(this.clubs, userId, clubId);
    if (!canShareDecks(membership.role))
      throw new AppError(
        'FORBIDDEN',
        'Only the club’s owner and admins can share decks with it. Members can suggest cards instead.',
      );
    await this.decks.getManagedDeck(userId, input.deckId);
    await this.clubs.shareDeck({
      clubId,
      deckId: input.deckId,
      sharedBy: userId,
      sharedAt: this.runtime.clock.now(),
    });
    return this.viewOf(membership);
  }

  private async viewOf(membership: Membership): Promise<ClubDto> {
    const [view] = await this.viewsOf([membership]);
    if (view === undefined) throw new AppError('INTERNAL', 'The club could not be read back.');
    return view;
  }

  /** Builds each member's view: the club, the member count and the shared decks that still exist. */
  private async viewsOf(memberships: readonly Membership[]): Promise<ClubDto[]> {
    if (memberships.length === 0) return [];
    const clubIds = memberships.map((membership) => membership.clubId);
    const [clubs, counts, shared] = await Promise.all([
      this.clubs.listByIds(clubIds),
      this.clubs.countMembers(clubIds),
      this.clubs.listSharedDecks(clubIds),
    ]);
    const decks = new Map(
      (await this.decks.listDecksByIds([...new Set(shared.map((link) => link.deckId))])).map(
        (deck) => [deck.id, deck],
      ),
    );
    const byId = new Map(clubs.map((club) => [club.id, club]));
    return memberships.flatMap((membership) => {
      const club = byId.get(membership.clubId);
      if (club === undefined) return [];
      const clubDecks = shared
        .filter((link) => link.clubId === club.id)
        .flatMap((link) => decks.get(link.deckId) ?? []);
      return [
        toClubDto({
          club,
          membership,
          memberCount: counts.get(club.id) ?? 1,
          decks: clubDecks,
        }),
      ];
    });
  }

  private async freeInviteCode(): Promise<string> {
    for (let attempt = 0; attempt < INVITE_CODE_ATTEMPTS; attempt += 1) {
      const code = this.inviteCodes.next();
      if ((await this.clubs.findByInviteCode(code)) === null) return code;
    }
    throw new AppError('INTERNAL', 'No free invite code could be found. Try again.');
  }
}
