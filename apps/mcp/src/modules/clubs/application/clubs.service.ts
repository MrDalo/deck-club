import type {
  CreateBattleToolInput,
  ListClubsToolInput,
  SuggestClubCardsToolInput,
} from '@deck-club/contracts';
import { Injectable } from '@nestjs/common';
import { notImplemented } from '../../../common/errors/deck-club-error.js';
import type { McpCaller } from '../../../common/mcp/mcp-caller.js';
import type { ToolReply } from '../../../common/mcp/tool-registration.js';

/**
 * Use cases behind clubs and live battles over MCP (spec 7, 8, 9).
 *
 * The interface is complete; the bodies are not built yet (Phases 2 and 3)
 * and refuse with NOT_IMPLEMENTED. Club tools must return only what a
 * member could see in the app (spec 9, behavior rules).
 */
@Injectable()
export class ClubsService {
  /** `list_clubs`: the user's clubs with their shared decks. */
  listClubs(_caller: McpCaller, _input: ListClubsToolInput): Promise<ToolReply> {
    return notImplemented('list_clubs');
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
