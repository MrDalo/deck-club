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
               │ pages, i18n, forms  │                  │ stateless tools     │
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
- **mcp** — the AI layer (spec 9). Each POST to `/mcp` builds a fresh MCP
  server bound to that request's bearer token and calls the API through the
  `DeckClubApi` port. Tool refusals are tool results (`REJECTED: CODE`).
- **api** — the core (spec 5). The only service with business rules and data.
  Verifies every bearer token against Supabase's published signing keys. Not
  published to the host in Docker.

Each service has `GET /health`. Only `web` and `mcp` publish ports, on
`127.0.0.1`.

## The API: a modular monolith of hexagonal modules

```
apps/api/src/
  main.ts, app.module.ts
  config/          env parsing (Zod), ConfigModule
  common/          AppError, ProblemDetailsFilter, auth (guard, verifier port, Supabase adapter), Clock/IdGenerator ports
  infra/database/  libSQL connection + migrations at boot
  modules/
    health/
    decks/         domain/ · application/ (+ ports/) · infrastructure/ (drizzle, memory) · http/ · testing/ · decks.facade.ts
```

A module talks to another only through its facade (async, returns DTOs).
`eslint-plugin-boundaries` fails the lint otherwise. Rule `20-backend` has the
details; the `hexagonal-module` skill is the recipe.

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

**AI adds 20 cards**

1. AI client → `POST http://localhost:4100/mcp` (`tools/call add_cards`) with
   the user's token.
2. MCP server validates arguments with `AddCardsToolInputSchema`, resolves
   the client name (handshake → remembered per token digest → User-Agent),
   calls `POST /decks/:id/cards/batch` with the token and
   `x-deck-club-client: Claude`.
3. API runs the same use case as the web app; provenance `mcp`/`Claude`.
4. Tool result: "Added 20 cards … <deck link>". The web shows "Added by
   Claude" badges.

## Data

SQLite through `@libsql/client` and Drizzle (ADR 0003). Each module owns its
tables (`decks`, `cards` today) in
`infrastructure/drizzle/<module>.schema.ts`; migrations are generated into
`apps/api/drizzle/` and applied at boot. User content is soft-deleted.

## Contracts

`packages/contracts` holds every Zod schema, DTO type, error code, header
name and MCP tool input. The web form, the API controller and the MCP tool
parse with the same schema, so the UI and the AI cannot validate differently.

## Errors

The API answers every failure as RFC 9457 problem details with a stable
`code` (`ERROR_CODES`), a human `detail` and a `traceId`. The web shows the
detail inline and the trace id for support; the MCP server relays it as
`REJECTED: <code>. <detail>`.

## Internationalisation and brand

next-intl with `en` (no URL prefix), `sk`, `cs`. Every string in
`apps/web/messages/*.json`. Light mode only, pastel palette, see
`brand/README.md`.

## Running it

- `pnpm dev` — api :4000, mcp :4100, web :3000, all reading the root `.env`.
- `docker compose --env-file .env up -d --build` — the same three services on
  the private network.
