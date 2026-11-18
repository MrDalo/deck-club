import type { McpServer } from '@modelcontextprotocol/server';
import { Inject, Injectable } from '@nestjs/common';
import {
  registerPrompt,
  registerResource,
  registerResourceTemplate,
} from '../../../common/mcp/content-registration.js';
import type { McpCaller } from '../../../common/mcp/mcp-caller.js';
import { McpFeature, type McpFeatureContributor } from '../../../common/mcp/mcp-feature.js';
import { registerTool } from '../../../common/mcp/tool-registration.js';
import { DecksService } from '../application/decks.service.js';
import { DECK_RESOURCES, DECK_TOOLS, MAKE_CARDS_PROMPT } from './deck-tool-specs.js';

/** Driving adapter: publishes the deck and card tools, resources and prompt over MCP. */
@McpFeature()
@Injectable()
export class DecksMcpFeature implements McpFeatureContributor {
  constructor(@Inject(DecksService) private readonly decks: DecksService) {}

  register(server: McpServer, caller: McpCaller): void {
    this.registerReads(server, caller);
    this.registerWrites(server, caller);
    registerResourceTemplate(server, DECK_RESOURCES.deck, (variables) =>
      this.decks.readDeck(caller, variables.deckId ?? ''),
    );
    registerResource(server, DECK_RESOURCES.cardWritingGuide, () =>
      this.decks.readCardWritingGuide(),
    );
    registerPrompt(server, MAKE_CARDS_PROMPT, (args) => this.decks.makeCardsPrompt(args));
  }

  private registerReads(server: McpServer, caller: McpCaller): void {
    registerTool(server, caller, DECK_TOOLS.listDecks, (input) =>
      this.decks.listDecks(caller, input),
    );
    registerTool(server, caller, DECK_TOOLS.getDeck, (input) => this.decks.getDeck(caller, input));
    registerTool(server, caller, DECK_TOOLS.searchCards, (input) =>
      this.decks.searchCards(caller, input),
    );
  }

  private registerWrites(server: McpServer, caller: McpCaller): void {
    registerTool(server, caller, DECK_TOOLS.createDeck, (input) =>
      this.decks.createDeck(caller, input),
    );
    registerTool(server, caller, DECK_TOOLS.addCards, (input) =>
      this.decks.addCards(caller, input),
    );
    registerTool(server, caller, DECK_TOOLS.updateCard, (input) =>
      this.decks.updateCard(caller, input),
    );
    registerTool(server, caller, DECK_TOOLS.deleteCards, (input) =>
      this.decks.deleteCards(caller, input),
    );
  }
}
