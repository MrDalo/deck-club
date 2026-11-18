import {
  AddCardsToolInputSchema,
  CreateDeckOutputSchema,
  CreateDeckToolInputSchema,
  DeleteCardsToolInputSchema,
  GetDeckOutputSchema,
  GetDeckToolInputSchema,
  ListDecksOutputSchema,
  ListDecksToolInputSchema,
  MCP_RESOURCE_URIS,
  MakeCardsPromptArgsSchema,
  SearchCardsOutputSchema,
  SearchCardsToolInputSchema,
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
      'Create a new private deck for the user. Call list_decks first and reuse a deck the user already has for the topic; create one only when none fits, and do not call this twice for one request. Give a short title, the language code of the card content and up to 10 lowercase tags. Returns the new deck id for add_cards and a link to share.',
    inputSchema: CreateDeckToolInputSchema,
    outputSchema: CreateDeckOutputSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    widgetUri: WIDGET_URIS.deckCreated,
  },
  addCards: {
    name: 'add_cards',
    title: 'Add cards',
    description:
      'Add 1 to 100 flashcards to a deck in one call. Write one fact per card with a short answer; prefer "reversible" for vocabulary. The result lists created cards, cards skipped as likely duplicates and invalid cards with reasons. Send an idempotencyKey so a retry never adds duplicates. Tell the user how many cards you added and share the deck link.',
    inputSchema: AddCardsToolInputSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    widgetUri: WIDGET_URIS.deck,
  },
  updateCard: {
    name: 'update_card',
    title: 'Update card',
    description:
      'Edit a card’s front, back, extra or tags when the user asks to fix or improve it. The user keeps their study progress on the card.',
    inputSchema: UpdateCardToolInputSchema,
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
  },
  deleteCards: {
    name: 'delete_cards',
    title: 'Delete cards',
    description:
      'Delete cards from a deck; they can be restored in Deck Club for 30 days. Always ask the user to confirm first, naming the cards you are about to delete.',
    inputSchema: DeleteCardsToolInputSchema,
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
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
