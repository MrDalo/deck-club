---
name: 'mcp-tool-surface'
description: 'Use for anything an AI client sees through the MCP server: adding or changing a tool, its input schema, its description, its result text, its scope, or how refusals read. The tool catalogue, the description style guide, result conventions and the per-tool checklist.'
---

# The MCP tool surface

The MCP server is the product's AI layer (spec 9). The AI is a guest: it goes
through the same API, validation and limits as the UI.

## Catalogue

| Tool                                                                         | Status    | Scope (spec 9) | API call                                  |
| ---------------------------------------------------------------------------- | --------- | -------------- | ----------------------------------------- |
| `list_decks`                                                                 | shipped   | decks:read     | `GET /decks`                              |
| `get_deck`                                                                   | shipped   | decks:read     | `GET /decks/:id` + `GET /decks/:id/cards` |
| `create_deck`                                                                | shipped   | decks:write    | `POST /decks`                             |
| `add_cards`                                                                  | shipped   | decks:write    | `POST /decks/:id/cards/batch`             |
| `search_cards`, `update_card`, `get_due_cards`, `submit_review`, `get_stats` | Phase 1   |                |                                           |
| `list_clubs`, `suggest_club_cards`                                           | Phase 2   | clubs          |                                           |
| `create_battle`, `delete_cards`                                              | Phase 3–4 |                |                                           |

Names live in `MCP_TOOL_NAMES` (contracts) and are never renamed.

## Descriptions (style guide)

Written for the AI, 1–3 sentences, in `tool-descriptions.ts`:

1. **When** to use it, and what to call first ("Call list_decks first…").
2. **What good input looks like** ("one fact per card, short answers").
3. **What to confirm with the user** before a destructive or bulk write.
4. **What to tell the user** after ("share the deck link").

Field descriptions go on the contracts schema with `.describe()`.

## Results

- Compact text, not JSON. Include the ids the next call needs and a web link
  (`deckUrl`) so the user can check the work.
- Empty states say what to do next ("Offer to create one with create_deck").
- A refusal is `REJECTED: <CODE>. <detail>` with `isError: true` — never a
  JSON-RPC error. The detail comes from the API and is safe to relay.
- Never include another user's data.

## Checklist for a new or changed tool

- [ ] Input schema in `packages/contracts/src/mcp-tools.ts`, name added to
      `MCP_TOOL_NAMES`.
- [ ] API endpoint exists with the same validation (parity: the UI can do it
      too).
- [ ] Port method + HTTP adapter (parses the response) + `FakeDeckClubApi`.
- [ ] Service method returning `ToolResult` through `runTool`; unit tests for
      success and a refusal.
- [ ] Registered in `create-mcp-server.ts` with `readOnlyHint`.
- [ ] Contract test in `apps/mcp/test/mcp.contract.test.ts`.
- [ ] Description reviewed by `learner-advocate`; a `dogfood-run` transcript.
- [ ] Writes carry the client name for provenance (automatic via
      `CLIENT_NAME_HEADER`).

## Auth today and next

Today the bearer is the user's Supabase access token (pasted, 1 hour). The
next auth slice adds OAuth 2.1 per the MCP authorization spec (protected
resource metadata, Supabase as the authorization server, scopes above) and an
AI-connections list in Settings; the client name then comes from the OAuth
client registration instead of `ClientNameRegistry`.
