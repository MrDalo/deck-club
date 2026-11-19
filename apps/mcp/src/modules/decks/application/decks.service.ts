import type {
  AddCardsToolInput,
  Card,
  CreateDeckToolInput,
  DeleteCardsToolInput,
  GetDeckToolInput,
  ListDecksToolInput,
  MakeCardsPromptArgs,
  SearchCardsToolInput,
  UpdateCardToolInput,
} from '@deck-club/contracts';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { DeckClubError, notImplemented } from '../../../common/errors/deck-club-error.js';
import {
  explainRepeatableWriteRefusal,
  explainWriteRefusal,
  type RepeatableWriteAdvice,
  type WriteRetryAdvice,
} from '../../../common/errors/write-retries.js';
import type { PromptMessageText, ResourceBody } from '../../../common/mcp/content-registration.js';
import type { McpCaller } from '../../../common/mcp/mcp-caller.js';
import type { ToolReply } from '../../../common/mcp/tool-registration.js';
import { ENV, type Env } from '../../../config/env.js';
import { formatSearchResults, toSearchResults } from './card-search-view.js';
import { formatCardsAdded, toCardsAdded } from './cards-added-view.js';
import { formatUpdatedCard, toUpdatedCard } from './card-updated-view.js';
import { type DeleteOutcome, formatDeletedCards, toDeletedCards } from './cards-deleted-view.js';
import { formatCreatedDeck, toCreatedDeck } from './deck-created-view.js';
import { formatDeckDetail, toDeckDetail } from './deck-detail-view.js';
import { formatDeckLibrary, toDeckLibrary } from './deck-library-view.js';
import { decodeCursor } from './deck-page.js';
import { DECKS_API, type DecksApi, type WriteResult } from './ports/decks-api.js';

/** How `create_deck` tells the AI to recover from an unconfirmed write. */
const CREATE_DECK_RETRY: WriteRetryAdvice = {
  tool: 'create_deck',
  outcome: 'the deck was created',
  check: 'call list_decks to check whether it exists',
};

/** How `add_cards` tells the AI to recover from an unconfirmed write. */
const ADD_CARDS_RETRY: WriteRetryAdvice = {
  tool: 'add_cards',
  outcome: 'the cards were added',
  check: 'call get_deck to check whether they are in the deck',
};

/** How `update_card` tells the AI to recover from an unconfirmed edit. */
const UPDATE_CARD_RETRY: RepeatableWriteAdvice = {
  tool: 'update_card',
  outcome: 'the card was updated',
  safeBecause: 'it sets the same values',
};

/** How `delete_cards` tells the AI to recover from an unconfirmed delete. */
const DELETE_CARDS_RETRY: RepeatableWriteAdvice = {
  tool: 'delete_cards',
  outcome: 'the cards were deleted',
  safeBecause: 'cards already deleted are reported as not found',
};

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
   * as structured content for the tool's view. With an idempotency key, a
   * retried call answers with the deck the first one created (ADR 0009).
   * @param caller - the verified user and their AI client
   * @param input - title, description, language, tags and the optional idempotency key, validated by the contracts schema
   * @returns the new deck
   * @throws DeckClubError VALIDATION_FAILED with field problems, a refusal about the key or an unconfirmed write explained for the AI, or the API's refusal
   */
  async createDeck(caller: McpCaller, input: CreateDeckToolInput): Promise<ToolReply> {
    const { idempotencyKey, ...deckInput } = input;
    const { value: deck, replayed } = await this.api
      .createDeck(caller, deckInput, { idempotencyKey })
      .catch((error: unknown) => {
        throw explainWriteRefusal(error, CREATE_DECK_RETRY, idempotencyKey !== undefined);
      });
    const output = toCreatedDeck(deck, this.env.WEB_PUBLIC_URL);
    // The title and description are the user's content: the log keeps ids and counts.
    this.logger.log({
      evt: 'decks.created',
      user: caller.userId,
      deck: deck.id,
      language: deck.language,
      tags: deck.tags.length,
      client: caller.clientName,
      replayed,
    });
    return { text: formatCreatedDeck(output, replayed), structuredContent: output };
  }

  /**
   * `add_cards`: up to 100 cards in one of the caller's decks, all or
   * nothing, stamped "Added by <client>" by the API. Replies with the new
   * card ids for the AI and the deck page they start on for the view.
   *
   * The deck is read first, so a deck that is not the caller's is refused
   * before anything is written, and the reply can name the deck even if
   * reading it back fails. Once the write has succeeded the reply is a
   * success whatever happens next: a refusal would make the AI send the same
   * cards again. The idempotency key goes to the API (ADR 0009): a retried
   * call answers with the cards the first one added, and adds none.
   * @param caller - the verified user and their AI client
   * @param input - the deck, the cards and the optional idempotency key, validated and defaulted by the contracts schema
   * @returns the cards added
   * @throws DeckClubError DECK_NOT_FOUND, VALIDATION_FAILED with field problems (nothing added), a refusal about the key, or UPSTREAM_UNAVAILABLE telling the AI how to retry safely
   */
  async addCards(caller: McpCaller, input: AddCardsToolInput): Promise<ToolReply> {
    const deck = await this.api.getDeck(caller, input.deckId);
    const { value: added, replayed } = await this.writeCards(caller, input);
    const deckCards = await this.readBack(caller, input.deckId);
    const output = toCardsAdded(deck, deckCards, added, this.env.WEB_PUBLIC_URL);
    // Card content is the user's: the log keeps ids and counts.
    this.logger.log({
      evt: 'cards.added',
      user: caller.userId,
      deck: deck.id,
      added: added.length,
      client: caller.clientName,
      replayed,
    });
    return { text: formatCardsAdded(output, added, replayed), structuredContent: output };
  }

  /**
   * `update_card`: changes a card's front, back, extra or tags, keeping its
   * type, its author and the user's study progress (spec 3). Replies with
   * the card as it is now and as it was, so the AI can report the change and
   * the view can show and undo it.
   *
   * The deck and its cards are read first: that gives the card as it was,
   * and a card that is not in the deck is refused before anything is written.
   * @param caller - the verified user and their AI client
   * @param input - the deck, the card and the fields to change, validated by the contracts schema
   * @returns the edited card
   * @throws DeckClubError DECK_NOT_FOUND, CARD_NOT_FOUND, VALIDATION_FAILED with field problems, or UPSTREAM_UNAVAILABLE saying a retry is safe
   */
  async updateCard(caller: McpCaller, input: UpdateCardToolInput): Promise<ToolReply> {
    const { deckId, cardId, ...patch } = input;
    const [deck, cards] = await Promise.all([
      this.api.getDeck(caller, deckId),
      this.api.listCards(caller, deckId),
    ]);
    const previous = cards.find((card) => card.id === cardId);
    if (previous === undefined)
      throw new DeckClubError(
        'CARD_NOT_FOUND',
        'No card with that id exists in this deck. Find the card’s id with get_deck or search_cards.',
      );
    const updated = await this.api
      .updateCard(caller, { deckId, cardId }, patch)
      .catch((error: unknown) => {
        throw explainRepeatableWriteRefusal(error, UPDATE_CARD_RETRY);
      });
    const output = toUpdatedCard(deck, previous, updated, this.env.WEB_PUBLIC_URL);
    // Card content is the user's: the log keeps ids and the names of the changed fields.
    this.logger.log({
      evt: 'cards.updated',
      user: caller.userId,
      deck: deck.id,
      card: cardId,
      changed: output.changedFields,
      client: caller.clientName,
    });
    return { text: formatUpdatedCard(output), structuredContent: output };
  }

  /**
   * `delete_cards`: deletes up to 100 cards of one of the caller's decks,
   * one at a time (the API deletes one card per call and only marks it
   * deleted). Replies with the deleted cards as they were, which is the only
   * way to get them back while the API cannot restore them, and the view's
   * data.
   *
   * The deck and its cards are read first. Ids not in the deck (already
   * deleted, or never there) are reported, not refused, so a retry after a
   * lost answer works. If Deck Club stops part-way, what was deleted is
   * still reported and the rest is listed as not deleted; only when nothing
   * was deleted is the call refused.
   * @param caller - the verified user and their AI client
   * @param input - the deck and the ids, validated by the contracts schema
   * @returns what was deleted
   * @throws DeckClubError DECK_NOT_FOUND, or the API's refusal (UPSTREAM_UNAVAILABLE saying a retry is safe) when nothing could be deleted
   */
  async deleteCards(caller: McpCaller, input: DeleteCardsToolInput): Promise<ToolReply> {
    const [deck, cards] = await Promise.all([
      this.api.getDeck(caller, input.deckId),
      this.api.listCards(caller, input.deckId),
    ]);
    const ids = [...new Set(input.cardIds)];
    const { stoppedBy, ...outcome } = await this.deleteEach(caller, deck.id, ids, cards);
    if (stoppedBy !== null) {
      this.logger.warn({
        evt: 'cards.delete_stopped',
        user: caller.userId,
        deck: deck.id,
        deleted: outcome.deleted.length,
        code: stoppedBy instanceof DeckClubError ? stoppedBy.code : 'unknown',
      });
      if (outcome.deleted.length === 0)
        throw explainRepeatableWriteRefusal(stoppedBy, DELETE_CARDS_RETRY);
    }
    const output = toDeletedCards(deck, cards.length, outcome, this.env.WEB_PUBLIC_URL);
    // Card content is the user's: the log keeps ids and counts.
    this.logger.log({
      evt: 'cards.deleted',
      user: caller.userId,
      deck: deck.id,
      deleted: output.deleted.length,
      notFound: output.notFound.length,
      notDeleted: output.notDeleted.length,
      client: caller.clientName,
    });
    return { text: formatDeletedCards(output), structuredContent: output };
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

  /**
   * Deletes the cards one by one, in the order asked for. A card the API no
   * longer finds counts as not found; any other refusal stops the run, and
   * the cards not reached yet are left alone.
   */
  private async deleteEach(
    caller: McpCaller,
    deckId: string,
    ids: readonly string[],
    cards: readonly Card[],
  ): Promise<DeleteOutcome & { stoppedBy: unknown }> {
    const inDeck = new Map(cards.map((card) => [card.id, card]));
    const deleted: Card[] = [];
    const notFound: string[] = [];
    for (const [index, cardId] of ids.entries()) {
      const card = inDeck.get(cardId);
      if (card === undefined) {
        notFound.push(cardId);
        continue;
      }
      try {
        await this.api.deleteCard(caller, { deckId, cardId });
        deleted.push(card);
      } catch (error) {
        if (error instanceof DeckClubError && error.code === 'CARD_NOT_FOUND') {
          notFound.push(cardId);
          continue;
        }
        const rest = ids.slice(index);
        notFound.push(...rest.filter((id) => !inDeck.has(id)));
        return {
          deleted,
          notFound,
          notDeleted: rest.filter((id) => inDeck.has(id)),
          stoppedBy: error,
        };
      }
    }
    return { deleted, notFound, notDeleted: [], stoppedBy: null };
  }

  /**
   * Sends the batch with the AI's idempotency key. The API may have written
   * it even when its answer never arrived (a timeout), so that refusal tells
   * the AI how to try again safely: with the same key, or after looking.
   */
  private async writeCards(
    caller: McpCaller,
    input: AddCardsToolInput,
  ): Promise<WriteResult<Card[]>> {
    try {
      return await this.api.addCards(
        caller,
        input.deckId,
        { cards: input.cards },
        { idempotencyKey: input.idempotencyKey },
      );
    } catch (error) {
      throw explainWriteRefusal(error, ADD_CARDS_RETRY, input.idempotencyKey !== undefined);
    }
  }

  /**
   * Reads the deck's cards after a write, for the view's page. It never
   * fails: the write already succeeded, so a read that does not work is
   * logged and the reply is built from the cards as they were sent.
   */
  private async readBack(caller: McpCaller, deckId: string): Promise<Card[] | null> {
    try {
      return await this.api.listCards(caller, deckId);
    } catch (error) {
      this.logger.warn({
        evt: 'cards.added.read_back_failed',
        user: caller.userId,
        deck: deckId,
        code: error instanceof DeckClubError ? error.code : 'unknown',
      });
      return null;
    }
  }
}
