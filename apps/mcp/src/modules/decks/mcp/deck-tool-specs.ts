import {
  AddCardsOutputSchema,
  AddCardsToolInputSchema,
  CreateDeckOutputSchema,
  CreateDeckToolInputSchema,
  DeleteCardsOutputSchema,
  DeleteCardsToolInputSchema,
  GetDeckOutputSchema,
  GetDeckToolInputSchema,
  ListDecksOutputSchema,
  ListDecksToolInputSchema,
  MCP_RESOURCE_URIS,
  MakeCardsPromptArgsSchema,
  SearchCardsOutputSchema,
  SearchCardsToolInputSchema,
  UpdateCardOutputSchema,
  UpdateCardToolInputSchema,
} from '@deck-club/contracts';
import type { StandardSchemaWithJSON } from '@modelcontextprotocol/server';
import type { PromptSpec, ResourceSpec } from '../../../common/mcp/content-registration.js';
import type { ToolSpec } from '../../../common/mcp/tool-registration.js';
import { WIDGET_URIS } from '../../../common/mcp/widgets.js';

/**
 * The deck and card tools as the AI sees them. Descriptions are written for
 * the AI (spec 9): when to use the tool, what good input looks like and what
 * to confirm with the user.
 */
export const DECK_TOOLS = {
  listDecks: {
    name: 'list_decks',
    title: 'List decks',
    description:
      'List the user’s Deck Club flashcard decks, personal and club, with ids, languages, card counts and due counts. Call this first whenever the user names a deck, to find its id.',
    inputSchema: ListDecksToolInputSchema,
    outputSchema: ListDecksOutputSchema,
    annotations: { readOnlyHint: true },
    widgetUri: WIDGET_URIS.deckLibrary,
  },
  getDeck: {
    name: 'get_deck',
    title: 'Get deck',
    description:
      'Show one deck and a page of up to 25 of its cards, with their fronts, backs and who added them. Use it when the user asks what a deck contains, or before adding cards to see what is there. When the result ends with a cursor, call again with it to read the next page; never invent one.',
    inputSchema: GetDeckToolInputSchema,
    outputSchema: GetDeckOutputSchema,
    annotations: { readOnlyHint: true },
    widgetUri: WIDGET_URIS.deck,
  },
  searchCards: {
    name: 'search_cards',
    title: 'Search cards',
    description:
      'Search the user’s cards, in every deck or one, ignoring case and accents; every word must appear. Use it before add_cards to skip facts the user already has (a match on the front is a likely duplicate), or to find a card the user mentions. Returns the best matches first, with deck and card ids.',
    inputSchema: SearchCardsToolInputSchema,
    outputSchema: SearchCardsOutputSchema,
    annotations: { readOnlyHint: true },
    widgetUri: WIDGET_URIS.searchResults,
  },
  createDeck: {
    name: 'create_deck',
    title: 'Create deck',
    description:
      'Create a new private deck for the user. Call list_decks first and reuse a deck the user already has for the topic; create one only when none fits. Give a short title, the language code of the card content and up to 10 lowercase tags. Send a new idempotencyKey (e.g. a UUID) with each new deck: if the call fails with UPSTREAM_UNAVAILABLE or times out, call again with the same arguments and key, and no second deck is made. Returns the new deck id for add_cards and a link to share.',
    inputSchema: CreateDeckToolInputSchema,
    outputSchema: CreateDeckOutputSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    widgetUri: WIDGET_URIS.deckCreated,
  },
  addCards: {
    name: 'add_cards',
    title: 'Add cards',
    description:
      'Add 1 to 100 flashcards to one of the user’s decks in one call; get the deck id from list_decks or create_deck. Check with search_cards first and leave out facts the user already has: this tool does not skip duplicates. Write one fact per card with a short answer, plain text only; use "reversible" for vocabulary. The call is all or nothing: if any card is invalid, nothing is added and the reply names the card to fix (cards.<index>.<field>). Send a new idempotencyKey (e.g. a UUID) with each batch: if the call fails with UPSTREAM_UNAVAILABLE or times out, call again with the same cards and key, and they are never added twice. Never repeat a call that succeeded. Returns the new card ids. Tell the user how many cards you added and share the deck link.',
    inputSchema: AddCardsToolInputSchema,
    outputSchema: AddCardsOutputSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    widgetUri: WIDGET_URIS.cardsAdded,
  },
  updateCard: {
    name: 'update_card',
    title: 'Update card',
    description:
      'Edit one card’s front, back, extra or tags when the user asks to fix or improve it; its type cannot change. Get the deck and card ids from get_deck, search_cards or add_cards; never invent them. Send only the fields to change and change only what the user asked for; tags, when sent, replace all of the card’s tags. Plain text only. The user keeps their study progress on the card. Returns each change as before → after: tell the user what you changed.',
    inputSchema: UpdateCardToolInputSchema,
    outputSchema: UpdateCardOutputSchema,
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
    widgetUri: WIDGET_URIS.cardUpdated,
  },
  deleteCards: {
    name: 'delete_cards',
    title: 'Delete cards',
    description:
      'Delete 1 to 100 cards from one of the user’s decks. Always ask the user to confirm first, naming the cards (their fronts) you are about to delete: deleted cards cannot be restored yet, only added back as new cards with add_cards, which starts their study progress over. Get the deck and card ids from get_deck or search_cards; never invent them. Ids not in the deck are reported, not deleted. Returns the deleted cards in full: keep them in case the user wants them back.',
    inputSchema: DeleteCardsToolInputSchema,
    outputSchema: DeleteCardsOutputSchema,
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
    widgetUri: WIDGET_URIS.cardsDeleted,
  },
} as const satisfies Record<string, ToolSpec<StandardSchemaWithJSON>>;

/** Read-only deck context an AI client can attach to a conversation. */
export const DECK_RESOURCES = {
  deck: {
    name: 'deck',
    uri: MCP_RESOURCE_URIS.deck,
    title: 'Deck',
    description: 'One deck and its cards as Markdown. Deck ids come from list_decks.',
    mimeType: 'text/markdown',
  },
  cardWritingGuide: {
    name: 'card_writing_guide',
    uri: MCP_RESOURCE_URIS.cardWritingGuide,
    title: 'Card-writing guide',
    description:
      'Rules for good flashcards: one fact per card, short answers, cloze for definitions.',
    mimeType: 'text/markdown',
  },
} as const satisfies Record<string, ResourceSpec>;

/** "Make cards from this" (spec 9, prompts). */
export const MAKE_CARDS_PROMPT = {
  name: 'make_cards',
  title: 'Make cards from this',
  description:
    'Turn pasted text, notes or a link into well-formed flashcards and add them to a deck.',
  argsSchema: MakeCardsPromptArgsSchema,
} as const satisfies PromptSpec<typeof MakeCardsPromptArgsSchema>;
