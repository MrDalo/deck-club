# Architecture

How Deck Club is built today. Decisions and their reasons are in
[`docs/adr/`](adr/README.md); what comes next is in [`roadmap.md`](roadmap.md).

## Services

```
                    people (browser)                  AI clients (Claude, ChatGPT, Codex)
                          │ :3000                                  │ :4100  Streamable HTTP + Bearer
                          ▼                                        ▼
               ┌─────────────────────┐                  ┌─────────────────────┐
               │ web  (Next.js 16)   │                  │ mcp  (NestJS)       │
               │ pages, i18n, forms  │                  │ MCP SDK v2, OAuth   │
               │ /api/v1/* forwarder │                  │ no data, no rules   │
               └──────────┬──────────┘                  └──────────┬──────────┘
                          │  Bearer <Supabase access token>        │
                          └───────────────┐       ┌────────────────┘
                     private network      ▼       ▼   (deck-club-private)
                               ┌──────────────────────────┐
                               │ api  (NestJS)            │──── JWKS ───▶ Supabase Auth
                               │ modular monolith         │
                               │ every business rule      │
                               └────────────┬─────────────┘
                                            ▼
                                   SQLite (libSQL file on /data)
```

- **web** — Next.js App Router, server components by default. Signs people in
  with Supabase (magic link, `@supabase/ssr` cookies). Browser data requests go
  to its own `/api/v1/*` route handler, which reads the session, attaches the
  access token and forwards an allowlisted path to the API.
- **mcp** — the AI layer (spec 9), on the MCP TypeScript SDK v2 (ADR 0008).
  An OAuth 2.1 resource server with Supabase Auth as the authorization
  server (the MCP server fetches its metadata and signing keys): it verifies
  every bearer token, then builds a fresh, caller-bound MCP server for each
  request from the feature modules' `@McpFeature()` adapters. It calls the
  API only through `DeckClubApiClient` with the user's token. Tool refusals
  are tool results (`REJECTED: CODE`). Guide: [`mcp-server.md`](mcp-server.md).
- **api** — the core (spec 5). The only service with business rules and data.
  Verifies every bearer token against Supabase's published signing keys. Not
  published to the host in Docker.

Each service has `GET /health`; the MCP server also `GET /health/ready`
(its dependencies). Only `web` and `mcp` publish ports, on `127.0.0.1`.

## The API: a modular monolith of hexagonal modules

```
apps/api/src/
  main.ts, app.module.ts
  config/          env parsing (Zod), ConfigModule
  common/          AppError, ProblemDetailsFilter, auth (guard, verifier port, Supabase adapter), Clock/IdGenerator ports,
                   idempotency (Idempotency-Key on writes: @Idempotent() interceptor, store port, SQLite adapter; ADR 0009)
  infra/database/  libSQL connection + migrations at boot
  modules/
    health/
    decks/         domain/ · application/ (+ ports/) · infrastructure/ (drizzle, memory) · http/ · testing/ · decks.facade.ts
                   (decks, cards, and card search: GET /cards/search, matching rule in domain/card-search.ts)
    study/         the same layers: FSRS scheduling, due cards, reviews, undo, stats and weak cards; reads cards through DecksFacade
    clubs/         the same layers: clubs, members and roles, invite codes, shared decks (GET /clubs, POST /clubs,
                   POST /clubs/join, POST /clubs/:clubId/decks); reads decks through DecksFacade (ADR 0010)
```

A module talks to another only through its facade (async, returns DTOs).
`eslint-plugin-boundaries` fails the lint otherwise. Rule `20-backend` has the
details; the `hexagonal-module` skill is the recipe.

## The MCP server: the same shape

```
apps/mcp/src/
  config/, common/ (errors, http bridge, MCP registration helpers, probe contract)
  infra/deck-club-api/   DeckClubApiClient, the only way to the API
  modules/
    mcp-server/  POST /mcp: origin → OAuth gate → client name → createMcpHandler
    auth/        OAuth 2.1 resource server (Supabase verifier, discovery metadata)
    health/      liveness + readiness
    decks/ study/ clubs/   application/ (use cases, ports) · infrastructure/ (API adapters) · mcp/ (adapters)
    widgets/     MCP Apps views (ui://): shared components in views/, DOM runtime + entries in views/browser/, bundled by esbuild into dist/views
```

Feature modules contribute their tools with `@McpFeature()` and probes with
`@HealthCheck()`; Nest's `DiscoveryService` collects them. Details and the
recipe for building a tool: [`mcp-server.md`](mcp-server.md).

## Request paths

**Person adds a card**

1. Browser → `POST /api/v1/decks/:id/cards` (web route handler).
2. Handler: allowlist check, `supabase.auth.getSession()`, forward to
   `http://api:4000/decks/:id/cards` with `Authorization: Bearer …` (10 s
   timeout).
3. API: `AuthGuard` verifies the JWT (JWKS, issuer, audience) → controller
   parses the body with `CreateCardInputSchema` → `CardService.add` checks
   ownership, builds the card (`provenance: app`), inserts it → `CardDto`.
4. TanStack Query invalidates `['decks', id]`, refreshing the count and list.

**AI connects, then adds 20 cards**

1. AI client → `POST http://localhost:4100/mcp` without a token → 401 with
   `WWW-Authenticate: Bearer resource_metadata="…/.well-known/oauth-protected-resource/mcp"`.
2. The client reads that metadata, finds Supabase as the authorization
   server, registers itself and signs the user in (the consent page in the
   web app is still to build). It retries with the Supabase access token.
3. MCP server: origin check, token verified with `supabase-js` `getClaims`
   plus issuer/audience/user checks, client name resolved (request envelope →
   remembered per token digest → User-Agent), fresh server built.
4. `tools/call list_decks`: scope `decks:read` checked, then the use case
   calls `GET /decks` with the token and `x-deck-club-client: Claude`. The
   result carries text for the model and `structuredContent` for its MCP
   Apps view, which the host renders in the chat as the deck library.
   `get_deck` works the same way over `GET /decks/:id` and its cards, one
   page of 25 at a time; its view can fetch the next page itself through the
   host. `search_cards` relays `GET /cards/search`, whose matching rule is
   the API's domain, and its view can search again through the host.
   `create_deck` is the first write: `POST /decks` with the caller's token,
   the deck created private and owned by the token's user.
5. `tools/call add_cards`: arguments validated with
   `AddCardsToolInputSchema` (the web editor's card schema), scope
   `decks:write` checked, use case run: `GET /decks/:id` (refuses another
   user's deck before any write), then `POST /decks/:id/cards/batch` with the
   caller's token, `x-deck-club-client: Claude` and, when the AI sent an
   `idempotencyKey`, `Idempotency-Key` (a retry is answered with the first
   batch, not added again), so the API runs the same use case as the web app
   (all or nothing, provenance `mcp`/`Claude`), then
   `GET /decks/:id/cards` to find where the new cards sit. The result gives
   the AI the new card ids and the deck link, and the cards added view shows
   them in the chat.

## Data

SQLite through `@libsql/client` and Drizzle (ADR 0003). Each module owns its
tables (`decks`, `cards`, `study_states`, `reviews`, `clubs`, `club_members`,
`club_decks` today) in
`infrastructure/drizzle/<module>.schema.ts`; the shared kernel's
`idempotency_keys` (not business data, kept a day) sits in
`common/idempotency/`. Migrations are generated into `apps/api/drizzle/` and
applied at boot. User content is soft-deleted.

## Contracts

`packages/contracts` holds every Zod schema, DTO type, error code, header
name and MCP tool input. The web form, the API controller and the MCP tool
parse with the same schema, so the UI and the AI cannot validate differently.

## Retrying writes

Writes that would change something again when repeated (`POST /decks`,
`POST /decks/:id/cards`, `POST /decks/:id/cards/batch`, `POST /study/reviews`,
`POST /study/reviews/undo`, `POST /clubs`) take an optional `Idempotency-Key` header
(ADR 0009). Per user, a retry of the same request gets the first response
back with `Idempotent-Replayed: true` and writes nothing; the key with a
different request is `IDEMPOTENCY_KEY_REUSED` (422), and while the first
request still runs, `IDEMPOTENCY_KEY_IN_USE` (409). Failed requests are not
kept, so a corrected retry can reuse the key. Keys live 24 hours. The MCP
server forwards the `idempotencyKey` of `create_deck` and `add_cards` as this
header.

## Errors

The API answers every failure as RFC 9457 problem details with a stable
`code` (`ERROR_CODES`), a human `detail` and a `traceId`. The web shows the
detail inline and the trace id for support; the MCP server relays it as
`REJECTED: <code>. <detail>` (a tool result for tools, a JSON-RPC error for
resources and prompts), followed by the field problems of a
`VALIDATION_FAILED` so an AI can correct its call. A capability published but not built yet answers
`NOT_IMPLEMENTED`.

## Internationalisation and brand

next-intl with `en` (no URL prefix), `sk`, `cs`. Every string in
`apps/web/messages/*.json`. Light mode only, pastel palette, see
`brand/README.md`.

## Running it

- `pnpm dev` — api :4000, mcp :4100, web :3000, all reading the root `.env`.
- `docker compose --env-file .env up -d --build` — the same three services on
  the private network.
