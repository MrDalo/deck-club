import type {
  CreateBattleToolInput,
  ListClubsToolInput,
  SuggestClubCardsToolInput,
} from '@deck-club/contracts';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { notImplemented } from '../../../common/errors/deck-club-error.js';
import type { McpCaller } from '../../../common/mcp/mcp-caller.js';
import type { ToolReply } from '../../../common/mcp/tool-registration.js';
import { ENV, type Env } from '../../../config/env.js';
import { formatClubList, toClubList } from './club-list-view.js';
import { CLUBS_API, type ClubsApi } from './ports/clubs-api.js';

/**
 * Use cases behind clubs and live battles over MCP (spec 7, 8, 9).
 *
 * Each one calls the core API through this module's port with the caller's
 * own token and holds no rule of its own. Club tools return only what a
 * member could see in the app (spec 9, behavior rules). The use cases that
 * are not built yet refuse with NOT_IMPLEMENTED.
 */
@Injectable()
export class ClubsService {
  private readonly logger = new Logger('mcp.clubs');

  constructor(
    @Inject(CLUBS_API) private readonly api: ClubsApi,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /**
   * `list_clubs`: the clubs the user belongs to, with their role and each
   * club's shared decks, as text for the AI and as structured content for
   * the tool's view.
   * @param caller - the verified user and their AI client
   * @param _input - no arguments
   * @returns the user's clubs
   * @throws DeckClubError when the API refuses the caller's token or cannot be reached
   */
  async listClubs(caller: McpCaller, _input: ListClubsToolInput): Promise<ToolReply> {
    const clubs = await this.api.listClubs(caller);
    const output = toClubList(clubs, this.env.WEB_PUBLIC_URL);
    // Club names, descriptions and invite codes are the club's: the log keeps counts.
    this.logger.log({
      evt: 'clubs.listed',
      user: caller.userId,
      clubCount: output.clubCount,
      deckCount: output.clubs.reduce((total, club) => total + club.decks.length, 0),
    });
    return { text: formatClubList(output), structuredContent: output };
  }

  /** `suggest_club_cards`: cards into a club deck's review queue (admins add directly). */
  suggestClubCards(_caller: McpCaller, _input: SuggestClubCardsToolInput): Promise<ToolReply> {
    return notImplemented('suggest_club_cards');
  }

  /** `create_battle`: a battle lobby with its join code and link. */
  createBattle(_caller: McpCaller, _input: CreateBattleToolInput): Promise<ToolReply> {
    return notImplemented('create_battle');
  }
}
