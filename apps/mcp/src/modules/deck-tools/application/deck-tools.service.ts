import { Inject, Injectable } from '@nestjs/common';
import type {
  AddCardsToolInput,
  CreateDeckToolInput,
  GetDeckToolInput,
} from '@deck-club/contracts';
import { ENV, type Env } from '../../../config/env.js';
import {
  type ApiCaller,
  ApiRequestError,
  DECK_CLUB_API,
  type DeckClubApi,
} from './ports/deck-club-api.js';
import { formatAddedCards, formatCreatedDeck, formatDeck, formatDeckList } from './tool-text.js';

/** What a tool hands back to the MCP client. */
export type ToolResult = {
  text: string;
  isError: boolean;
};

/**
 * Converts a refusal from the core API into a tool result rather than a
 * protocol error, so the AI reads the reason and can tell the user
 * (rule 20-backend: never a JSON-RPC error for a business rule).
 */
async function runTool(work: () => Promise<string>): Promise<ToolResult> {
  try {
    return { text: await work(), isError: false };
  } catch (error) {
    if (error instanceof ApiRequestError)
      return { text: `REJECTED: ${error.code}. ${error.detail}`, isError: true };
    throw error;
  }
}

/** The deck tools' use cases. Pure orchestration over the {@link DeckClubApi} port. */
@Injectable()
export class DeckToolsService {
  constructor(
    @Inject(DECK_CLUB_API) private readonly api: DeckClubApi,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async listDecks(caller: ApiCaller): Promise<ToolResult> {
    return runTool(async () =>
      formatDeckList(await this.api.listDecks(caller), this.env.WEB_PUBLIC_URL),
    );
  }

  async getDeck(caller: ApiCaller, input: GetDeckToolInput): Promise<ToolResult> {
    return runTool(async () =>
      formatDeck(await this.api.getDeck(caller, input.deckId), this.env.WEB_PUBLIC_URL),
    );
  }

  async createDeck(caller: ApiCaller, input: CreateDeckToolInput): Promise<ToolResult> {
    return runTool(async () =>
      formatCreatedDeck(await this.api.createDeck(caller, input), this.env.WEB_PUBLIC_URL),
    );
  }

  async addCards(caller: ApiCaller, input: AddCardsToolInput): Promise<ToolResult> {
    return runTool(async () => {
      const cards = await this.api.addCards(caller, input.deckId, input.cards);
      return formatAddedCards(cards, input.deckId, this.env.WEB_PUBLIC_URL);
    });
  }
}
