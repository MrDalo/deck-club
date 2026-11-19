import { type Club, ClubListSchema } from '@deck-club/contracts';
import type { McpCaller } from '../../../common/mcp/mcp-caller.js';
import {
  credentialsOf,
  type DeckClubApiClient,
} from '../../../infra/deck-club-api/deck-club-api-client.js';
import type { ClubsApi } from '../application/ports/clubs-api.js';

/**
 * Adapter: the core API's `/clubs` endpoints over the private network. It
 * forwards the caller's access token; the API verifies it again and answers
 * only with the clubs that user belongs to.
 */
export class HttpClubsApi implements ClubsApi {
  /** @param api - the shared API client */
  constructor(private readonly api: DeckClubApiClient) {}

  async listClubs(caller: McpCaller): Promise<Club[]> {
    const list = await this.api.send({
      method: 'GET',
      path: '/clubs',
      schema: ClubListSchema,
      credentials: credentialsOf(caller),
    });
    return list.clubs;
  }
}
