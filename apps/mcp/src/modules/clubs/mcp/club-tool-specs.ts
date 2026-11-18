import {
  CreateBattleToolInputSchema,
  ListClubsToolInputSchema,
  SuggestClubCardsToolInputSchema,
} from '@deck-club/contracts';
import type { StandardSchemaWithJSON } from '@modelcontextprotocol/server';
import type { ToolSpec } from '../../../common/mcp/tool-registration.js';

/** The club tools as the AI sees them (spec 9; descriptions written for the AI). */
export const CLUB_TOOLS = {
  listClubs: {
    name: 'list_clubs',
    title: 'List clubs',
    description:
      'List the clubs the user belongs to, with their shared decks and the user’s role. Call it before suggest_club_cards or create_battle to find club and deck ids.',
    inputSchema: ListClubsToolInputSchema,
    annotations: { readOnlyHint: true },
  },
  suggestClubCards: {
    name: 'suggest_club_cards',
    title: 'Suggest club cards',
    description:
      'Propose 1 to 100 cards for a shared club deck. They wait in the club’s review queue until an owner or admin accepts them; cards from admins are added directly. Tell the user whether the cards need approval. Send an idempotencyKey so a retry never suggests duplicates.',
    inputSchema: SuggestClubCardsToolInputSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  },
  createBattle: {
    name: 'create_battle',
    title: 'Create battle',
    description:
      'Create a live quiz battle lobby from a deck and return its join code and link. Confirm the deck and the settings (questions, time per question, who can join) with the user first, then share the code and link.',
    inputSchema: CreateBattleToolInputSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  },
} as const satisfies Record<string, ToolSpec<StandardSchemaWithJSON>>;
