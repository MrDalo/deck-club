import type { Club } from '@deck-club/contracts';
import type { McpCaller } from '../../../../common/mcp/mcp-caller.js';

/**
 * Port: the club endpoints of the core API. Every call carries the user's
 * own token, so the API applies the same membership rules as the web app
 * and answers only what a member may see (spec 9: club tools expose no other
 * user's personal data).
 */
export type ClubsApi = {
  /**
   * The clubs the caller belongs to, with their role and the decks each
   * club shares.
   * @throws DeckClubError with the API's code when the API refuses or cannot be reached
   */
  listClubs(caller: McpCaller): Promise<Club[]>;
};

/** Nest injection token for {@link ClubsApi}. */
export const CLUBS_API = Symbol('CLUBS_API');
