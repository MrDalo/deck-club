# Roadmap

Phases come from spec 12. Each phase ships as vertical slices
(`feature-workflow`).

<!-- status:start -->

Phase 0 (foundation) done: monorepo, CI, Docker, Claude setup, decks + cards CRUD in API, web and MCP.
Study API done (FSRS-7, reviews, undo, Today, stats). Next: study MCP tools (Dalibor) and the web Today + review session.
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

- [x] **Study slice, API**: `study` module (FSRS-7 via `ts-fsrs`, ADR 0007; study states, append-only reviews, daily limits, day boundary, siblings, undo, streak, retention) with `GET /study/today`, `GET /study/due`, `POST /study/reviews`, `POST /study/reviews/undo`, `GET /study/stats`
- [ ] **Study slice, MCP** (owner: Dalibor): `get_due_cards`, `submit_review`, `get_stats` in `apps/mcp` over the study endpoints above
- [ ] **Study slice, web**: Today dashboard, review session (Space, 1–4, interval hints, undo), session summary
- [ ] **MCP OAuth 2.1**: protected-resource metadata, Supabase as authorization server, scopes, AI connections in Settings (list, revoke); replaces the pasted token
- [ ] `search_cards`, `update_card`; duplicate detection and `idempotencyKey` on `add_cards`; per-user rate limits (60 calls/min, 2,000 cards/day)
- [ ] Profile and review settings (time zone, day start hour, limits, retention); one OAuth sign-in provider
- [ ] Tags and search on the deck page; bulk actions; card type `reversible` sibling handling
- [ ] CSV import and export, full JSON export, account deletion
- [ ] Playwright E2E for spec 4.1–4.5 and an accessibility check in CI

## Phase 2 — Clubs and leagues

Clubs, invites, roles, shared decks, suggestions, `list_clubs`,
`suggest_club_cards`, weekly league job, Cloze and Type-in, Stats screen.

## Phase 3 — Live battles

Realtime service (choice open), host and player screens, guest join, scoring,
`create_battle`, opt-in SRS feed.

## Phase 4 — Sharing and polish

Public gallery with licences and reporting, Anki import/export, MCP prompts,
`delete_cards`, PWA install and reminders.
