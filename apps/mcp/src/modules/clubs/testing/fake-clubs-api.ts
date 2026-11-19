import type { Club, ClubDeck } from '@deck-club/contracts';
import type { DeckClubError } from '../../../common/errors/deck-club-error.js';
import type { McpCaller } from '../../../common/mcp/mcp-caller.js';
import type { ClubsApi } from '../application/ports/clubs-api.js';

/**
 * A club deck as the API returns it, with everything but the given fields filled in.
 * @param deck - the fields that matter to the test
 * @returns the deck
 */
export function testClubDeck(deck: Partial<ClubDeck> & Pick<ClubDeck, 'id' | 'title'>): ClubDeck {
  return { description: '', language: 'es', cardCount: 40, ...deck };
}

/**
 * A club as the API returns it to one of its members, with everything but
 * the given fields filled in: the caller owns it, so the invite code shows.
 * @param club - the fields that matter to the test
 * @returns the club
 */
export function testClub(club: Partial<Club> & Pick<Club, 'id' | 'name'>): Club {
  return {
    description: '',
    visibility: 'private',
    role: 'owner',
    memberCount: 12,
    memberLimit: 100,
    inviteCode: 'FRIDAY-42',
    joinedAt: '2026-11-01T10:00:00.000Z',
    decks: [],
    ...club,
  };
}

/** In-memory {@link ClubsApi}: the clubs of each access token's owner, like the API. */
export class FakeClubsApi implements ClubsApi {
  readonly callers: McpCaller[] = [];
  private readonly memberships = new Map<string, Club[]>();
  private failure: DeckClubError | null = null;

  /** Makes the owner of `accessToken` a member of these clubs. */
  withClubs(accessToken: string, clubs: Club[]): this {
    this.memberships.set(accessToken, clubs);
    return this;
  }

  /** Makes every call refuse, as the API would. */
  failWith(error: DeckClubError): this {
    this.failure = error;
    return this;
  }

  listClubs(caller: McpCaller): Promise<Club[]> {
    this.callers.push(caller);
    if (this.failure !== null) return Promise.reject(this.failure);
    return Promise.resolve(this.memberships.get(caller.accessToken) ?? []);
  }
}
