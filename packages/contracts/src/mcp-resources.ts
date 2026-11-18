/**
 * MCP resources: read-only context an AI client can attach to a
 * conversation. URIs are additive forever, like tool names; a template's
 * `{variable}` follows RFC 6570.
 */
export const MCP_RESOURCE_URIS = {
  /** One deck and its cards. */
  deck: 'deck-club://decks/{deckId}',
  /** Today's due reviews and new cards, per deck and in total (spec 4.4). */
  today: 'deck-club://study/today',
  /** The card-writing rules the "Make cards from this" prompt follows (spec 9). */
  cardWritingGuide: 'deck-club://guides/card-writing',
} as const;
export type McpResourceKey = keyof typeof MCP_RESOURCE_URIS;
