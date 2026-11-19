import {
  CreateBattleToolInputSchema,
  ListClubsOutputSchema,
  ListClubsToolInputSchema,
  SuggestClubCardsToolInputSchema,
} from '@deck-club/contracts';
import type { StandardSchemaWithJSON } from '@modelcontextprotocol/server';
import type { ToolSpec } from '../../../common/mcp/tool-registration.js';
import { WIDGET_URIS } from '../../../common/mcp/widgets.js';

/** The club tools as the AI sees them (spec 9; descriptions written for the AI). */
export const CLUB_TOOLS = {
  listClubs: {
    name: 'list_clubs',
    title: 'List clubs',
    description:
      'List the clubs the user belongs to, with the user’s role in each (owner, admin or member), the member count and the decks each club shares. Call it before suggest_club_cards or create_battle to find club and deck ids. Only owners and admins see a club’s invite code; share it only if the user asks.',
    inputSchema: ListClubsToolInputSchema,
    outputSchema: ListClubsOutputSchema,
    annotations: { readOnlyHint: true },
    widgetUri: WIDGET_URIS.clubList,
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
