import type {
  AddCardsToolInput,
  CreateDeckToolInput,
  DeleteCardsToolInput,
  GetDeckToolInput,
  ListDecksToolInput,
  MakeCardsPromptArgs,
  SearchCardsToolInput,
  UpdateCardToolInput,
} from '@deck-club/contracts';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { notImplemented } from '../../../common/errors/deck-club-error.js';
import type { PromptMessageText, ResourceBody } from '../../../common/mcp/content-registration.js';
import type { McpCaller } from '../../../common/mcp/mcp-caller.js';
import type { ToolReply } from '../../../common/mcp/tool-registration.js';
import { ENV, type Env } from '../../../config/env.js';
import { formatSearchResults, toSearchResults } from './card-search-view.js';
import { formatCreatedDeck, toCreatedDeck } from './deck-created-view.js';
import { formatDeckDetail, toDeckDetail } from './deck-detail-view.js';
import { formatDeckLibrary, toDeckLibrary } from './deck-library-view.js';
import { decodeCursor } from './deck-page.js';
import { DECKS_API, type DecksApi } from './ports/decks-api.js';

/**
 * Use cases behind the deck and card part of the MCP surface (spec 9):
 * reading the library, writing cards, and the card-writing prompt.
 *
 * Each one calls the core API through this module's port with the caller's
 * own token and holds no business rule of its own (spec 5: rules live only
 * in the core). The use cases that are not built yet refuse with
 * NOT_IMPLEMENTED.
 */
@Injectable()
export class DecksService {
  private readonly logger = new Logger('mcp.decks');

  constructor(
    @Inject(DECKS_API) private readonly api: DecksApi,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /**
   * `list_decks`: the user's decks, as text for the AI and as structured
   * content for the tool's view.
   * @param caller - the verified user and their AI client
   * @param _input - no arguments
   * @returns the deck library
   * @throws DeckClubError when the API refuses the caller's token or cannot be reached
   */
  async listDecks(caller: McpCaller, _input: ListDecksToolInput): Promise<ToolReply> {
    const library = toDeckLibrary(await this.api.listDecks(caller), this.env.WEB_PUBLIC_URL);
    this.logger.log({ evt: 'decks.listed', user: caller.userId, deckCount: library.deckCount });
    return { text: formatDeckLibrary(library), structuredContent: library };
  }

  /**
   * `get_deck`: one deck and a page of its cards, as text for the AI and as
   * structured content for the tool's view.
   * @param caller - the verified user and their AI client
   * @param input - the deck and, for a later page, the cursor from the previous one
   * @returns the deck and the page
   * @throws DeckClubError VALIDATION_FAILED for a foreign cursor, DECK_NOT_FOUND when the deck is not the caller's, or the API's refusal
   */
  async getDeck(caller: McpCaller, input: GetDeckToolInput): Promise<ToolReply> {
    const offset = decodeCursor(input.deckId, input.cursor);
    const [deck, cards] = await Promise.all([
      this.api.getDeck(caller, input.deckId),
      this.api.listCards(caller, input.deckId),
    ]);
    const detail = toDeckDetail(deck, cards, offset, this.env.WEB_PUBLIC_URL);
    this.logger.log({
      evt: 'decks.read',
      user: caller.userId,
      deck: deck.id,
      firstCard: detail.firstCardNumber,
      cardsShown: detail.cards.length,
      cardCount: cards.length,
    });
    return { text: formatDeckDetail(detail), structuredContent: detail };
  }

  /**
   * `search_cards`: the user's cards that match, best first, as text for the
   * AI and as structured content for the tool's view.
   * @param caller - the verified user and their AI client
   * @param input - the words, an optional deck and the most results to return
   * @returns the matches
   * @throws DeckClubError DECK_NOT_FOUND when the deck filter is not the caller's, or the API's refusal
   */
  async searchCards(caller: McpCaller, input: SearchCardsToolInput): Promise<ToolReply> {
    const result = await this.api.searchCards(caller, {
      q: input.query,
      ...(input.deckId !== undefined && { deckId: input.deckId }),
      limit: input.limit,
    });
    const output = toSearchResults(result, input, this.env.WEB_PUBLIC_URL);
    // The search words are the user's own content: they are counted, never logged.
    this.logger.log({
      evt: 'cards.searched',
      user: caller.userId,
      scope: input.deckId === undefined ? 'all' : 'deck',
      words: input.query.split(/\s+/).filter((word) => word !== '').length,
      matches: output.totalMatches,
      shown: output.matches.length,
    });
    return { text: formatSearchResults(output), structuredContent: output };
  }

  /**
   * `create_deck`: a new private deck for the caller, as text for the AI and
   * as structured content for the tool's view.
   * @param caller - the verified user and their AI client
   * @param input - title, description, language and tags, validated by the contracts schema
   * @returns the new deck
   * @throws DeckClubError VALIDATION_FAILED with field problems, or the API's refusal
   */
  async createDeck(caller: McpCaller, input: CreateDeckToolInput): Promise<ToolReply> {
    const deck = await this.api.createDeck(caller, input);
    const output = toCreatedDeck(deck, this.env.WEB_PUBLIC_URL);
    // The title and description are the user's content: the log keeps ids and counts.
    this.logger.log({
      evt: 'decks.created',
      user: caller.userId,
      deck: deck.id,
      language: deck.language,
      tags: deck.tags.length,
      client: caller.clientName,
    });
    return { text: formatCreatedDeck(output), structuredContent: output };
  }

  /** `add_cards`: up to 100 cards; reports created, skipped duplicates and invalid cards. */
  addCards(_caller: McpCaller, _input: AddCardsToolInput): Promise<ToolReply> {
    return notImplemented('add_cards');
  }

  /** `update_card`: edits content or tags; study state is kept (spec 3). */
  updateCard(_caller: McpCaller, _input: UpdateCardToolInput): Promise<ToolReply> {
    return notImplemented('update_card');
  }

  /** `delete_cards`: soft-deletes cards, restorable for 30 days. */
  deleteCards(_caller: McpCaller, _input: DeleteCardsToolInput): Promise<ToolReply> {
    return notImplemented('delete_cards');
  }

  /** Resource `deck-club://decks/{deckId}`: one deck and its cards as text. */
  readDeck(_caller: McpCaller, _deckId: string): Promise<ResourceBody> {
    return notImplemented('The deck resource');
  }

  /** Resource `deck-club://guides/card-writing`: the rules good cards follow. */
  readCardWritingGuide(): Promise<ResourceBody> {
    return notImplemented('The card-writing guide');
  }

  /** Prompt `make_cards`: turn a source into well-formed cards in a deck. */
  makeCardsPrompt(_args: MakeCardsPromptArgs): Promise<PromptMessageText[]> {
    return notImplemented('The "Make cards from this" prompt');
  }
}
