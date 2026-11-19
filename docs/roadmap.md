# Roadmap

Phases come from spec 12. Each phase ships as vertical slices
(`feature-workflow`).

<!-- status:start -->

Phase 0 (foundation) done: monorepo, CI, Docker, Claude setup, decks + cards CRUD in API, web and MCP.
Study API done (FSRS-6 via ts-fsrs 5, reviews, undo, Today, stats). MCP server rebuilt on SDK v2 (stateless) with Supabase OAuth 2.1, readiness and the full spec 9 interface (ADR 0008); `list_decks`, `get_deck`, `search_cards` (with `GET /cards/search` in the API), `create_deck`, `add_cards`, `update_card`, `delete_cards`, `get_due_cards`, `submit_review` and `get_stats` are implemented with their MCP Apps views (every Phase 1 tool). Next: the OAuth consent page in web and the web study slice.
<!-- status:end -->

## Phase 0 — Foundation ✅

- [x] Turborepo + pnpm workspace, shared ESLint/Prettier/tsconfig/Vitest presets, knip
- [x] `packages/contracts`: deck, card, error, auth, MCP tool schemas
- [x] API: modular monolith, hexagonal `decks` module (decks + cards CRUD, soft delete, provenance), SQLite via Drizzle + libSQL, Supabase JWT verification, problem details
- [x] MCP server: stateless Streamable HTTP; `list_decks`, `get_deck`, `create_deck`, `add_cards`
- [x] Web: next-intl (en, sk, cs), brand, magic-link sign-in, deck library, deck page with keyboard-first card editor, Connect your AI
- [x] Dockerfiles + Compose on a private network; GitHub Actions CI
- [x] Claude Code rules, agents, skills and hooks

## Phase 1 — MVP: solo learning plus MCP

- [x] **Study slice, API**: `study` module (FSRS-6 via `ts-fsrs` 5, ADR 0007; study states, append-only reviews, daily limits, day boundary, siblings, undo, streak, retention) with `GET /study/today`, `GET /study/due`, `POST /study/reviews`, `POST /study/reviews/undo`, `GET /study/stats`
- [x] **MCP platform** (ADR 0008): SDK v2 stateless Streamable HTTP (2026-07-28 plus the 2025 fallback), feature modules, OAuth 2.1 resource server (protected resource metadata, Supabase as authorization server, token verification, per-tool scopes), readiness probes, MCP Apps view resources; every spec 9 tool, the three prompts and the context resources published as interfaces (`NOT_IMPLEMENTED`)
- [x] **`list_decks` over the API**, with its MCP Apps view (the deck library in the chat: index cards, counts, open-deck and ask-for-cards actions), structured output validated on both sides, per-call logging
- [x] **`get_deck` over the API**, paged (25 cards, deck-bound cursor), with its MCP Apps view (ruled index cards, "Added by" chips, "Show more cards" through the host); view code refactored into shared components and one view runtime
- [x] **`search_cards` end to end**: `GET /cards/search` in the API (matching rule in the decks domain: every word, case- and accent-insensitive, ranked with the likely duplicate first), the MCP tool, and its MCP Apps view (highlighted matches, search box that re-runs the tool through the host); shared view components extracted (index card, highlight, tool output, host calls)
- [x] **`create_deck` over the API**, the first write: `POST /decks`, private by default, with its MCP Apps view (the new deck's tile and the next step); API field problems relayed to the AI as `Fix: <field>: <message>`; `deckTile` extracted as a shared view component
- [x] **`add_cards` over the API**: `POST /decks/:id/cards/batch` (all or nothing, "Added by" provenance), with its MCP Apps view (the cards just added, paged through `get_deck`, and the next step); a write is never reported as a refusal, and an unconfirmed write tells the AI to check before retrying
- [x] **Idempotency keys in the API** (ADR 0009): optional `Idempotency-Key` header on `POST /decks`, `/decks/:id/cards`, `/decks/:id/cards/batch`, `/study/reviews`, `/study/reviews/undo`; retries replay the first response, a reused key is `IDEMPOTENCY_KEY_REUSED`, a running one `IDEMPOTENCY_KEY_IN_USE`
- [x] **Idempotency keys in the MCP server**: `create_deck` and `add_cards` forward the AI's `idempotencyKey` as `Idempotency-Key`; a replayed answer says nothing was written twice, and refusals tell the AI how to retry safely
- [x] **`update_card` over the API**: `PATCH /decks/:id/cards/:cardId` (only the fields sent, type, author and study state kept), with its MCP Apps view (the card now, each change before and after, "Undo this change" through the host)
- [x] **`delete_cards` over the API**: one `DELETE` per card, every id answered (deleted, not found, not deleted when Deck Club stops part-way), with its MCP Apps view (the deleted cards and "Add them back as new cards" through the host, with a stable idempotency key)
- [ ] **Restoring deleted cards** (spec 3: soft delete for 30 days, so mistakes can be undone): an API endpoint and a screen in the web app; then the cards deleted view offers a true restore that keeps study progress
- [x] **`get_due_cards` over the API**: `GET /study/due` (session order and daily limits are the API's), one deck or all, with its MCP Apps view (each question on an index card, the answer face down until shown, "Quiz me in the chat"); `deckUrl`/`libraryUrl` moved to the shared kernel (`common/web/`)
- [x] **`submit_review` over the API**: `POST /study/reviews` with the AI's `idempotencyKey` (a retried rating is recorded once), "Added by" provenance as the review's source; rated from the study session view through the host (Again/Hard/Good/Easy with when the card comes back, a key per session and card, focus to the next card, ratings shared with the assistant as model context, "Next cards"); write-retry advice and `timeUntil` moved to the shared kernel
- [x] **`get_stats` over the API**: `GET /study/stats` and `GET /study/today`, with weak cards added to the stats in the API (study domain rule: a side rated Again at least twice in 30 days, at most 5, content through the decks facade); its MCP Apps view (streak, today's progress bar, retention and total tiles, still due per deck with "Quiz me", weak cards with "Help me remember it", "Refresh" through the host)
- [ ] Correcting a rating through MCP (the API's undo); the workload forecast (spec 6) in the stats
- [ ] **Study slice, web**: Today dashboard, review session (Space, 1–4, interval hints, undo), session summary
- [ ] **MCP OAuth 2.1, web side**: the consent page Supabase's OAuth server redirects to, scope grants per AI connection (read by `grantedScopes`), AI connections in Settings (list, revoke); then retire the pasted token. The MCP side is done (see MCP platform).
- [ ] Duplicate detection on `add_cards` (reusing the card search rule); per-user rate limits (60 calls/min, 2,000 cards/day)
- [ ] Profile and review settings (time zone, day start hour, limits, retention); one OAuth sign-in provider
- [ ] Tags and search on the deck page; bulk actions; card type `reversible` sibling handling
- [ ] CSV import and export, full JSON export, account deletion
- [ ] Playwright E2E for spec 4.1–4.5 and an accessibility check in CI

## Phase 2 — Clubs and leagues

- [x] **`list_clubs` in the MCP server**: `GET /clubs` defined in contracts (`ClubListSchema`: what a member may see, the invite code only for roles that may invite), the tool and its MCP Apps view (clubs, the user's role, members, invite code, shared decks as library tiles). `credentialsOf` and `countLabel` moved to the shared kernel.
- [x] **Clubs module in the API** (ADR 0010: clubs share decks by link, the deck stays its author's): `clubs`, `club_members`, `club_decks` (migration 0003); `GET /clubs`, `POST /clubs` (idempotent; creator is owner, unambiguous 8-character invite code), `POST /clubs/join` (any case, with or without the dash; 100 members at most, checked atomically), `POST /clubs/:clubId/decks` (owners and admins share their own decks); `DecksFacade.listDecksByIds`; verified end to end with `list_clubs` over HTTP
- [ ] **Club decks for members** (spec 7): members read and study decks their club shares, admins edit them (a `ClubsFacade` behind a port in decks and study); then web screens for clubs, and `suggest_club_cards`

Clubs, invites, roles, shared decks, suggestions, `list_clubs`,
`suggest_club_cards`, weekly league job, Cloze and Type-in, Stats screen.

## Phase 3 — Live battles

Realtime service (choice open), host and player screens, guest join, scoring,
`create_battle`, opt-in SRS feed.

## Phase 4 — Sharing and polish

Public gallery with licences and reporting, Anki import/export, MCP prompts,
PWA install and reminders.
