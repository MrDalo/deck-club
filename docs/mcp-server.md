# The MCP server (`apps/mcp`)

How Deck Club's AI layer (spec 9) is built. Decisions: ADR
[0004](adr/0004-mcp-server-as-api-client.md) and
[0008](adr/0008-mcp-sdk-v2-oauth-and-apps.md).

## What it is

A NestJS service that lets the user's own AI assistant (Claude, ChatGPT,
Codex…) work with Deck Club over the Model Context Protocol:

- **Streamable HTTP, stateless** on the MCP TypeScript SDK v2
  (`@modelcontextprotocol/server`, protocol revision 2026-07-28). Every
  request gets a fresh `McpServer` bound to that request's verified caller;
  2025-era clients are served by the SDK's stateless fallback from the same
  factory, so both eras see the same tools. No sessions, no server stream:
  `GET`/`DELETE /mcp` answer 405.
- **OAuth 2.1 resource server** with **Supabase Auth as the authorization
  server**. The MCP server publishes discovery metadata, verifies tokens with
  `@supabase/supabase-js` and answers unauthenticated requests with the
  challenge that starts an AI client's sign-in.
- **MCP Apps** (`@modelcontextprotocol/ext-apps`): `ui://` views that hosts
  render inside the chat, linked from tools with `_meta.ui.resourceUri`.
- **A client of the core API**, never a data owner: every use case will call
  the API with the user's own token (ADR 0004). No business rules here.

## Status

The platform is complete: transport, OAuth, health, and the whole published
interface. `list_decks`, `get_deck`, `search_cards` and `create_deck` (the
first write) are built end to end, each with its MCP Apps view; the other
tools, the resources and the prompts are interfaces only and refuse with
`NOT_IMPLEMENTED` until their slice is built.

| Capability                                                                    | State                                         |
| ----------------------------------------------------------------------------- | --------------------------------------------- |
| Stateless Streamable HTTP (both eras)                                         | Done                                          |
| OAuth discovery, token verification, 401                                      | Done; needs the Supabase setup below          |
| Consent screen for Supabase's OAuth flow                                      | **Not built** (web app, see "Supabase setup") |
| Health: liveness and readiness                                                | Done                                          |
| `list_decks` + its deck library view                                          | **Done**                                      |
| `get_deck` + its deck view                                                    | **Done**                                      |
| `search_cards` + its search results view (and `GET /cards/search` in the API) | **Done**                                      |
| `create_deck` + its deck created view                                         | **Done**                                      |
| 9 further tools, 3 prompts, 3 resources                                       | Interface only (`NOT_IMPLEMENTED`)            |
| 2 further MCP Apps views (study session, stats)                               | Placeholder HTML                              |

## Layout: a modular monolith of hexagonal modules

```
apps/mcp/src/
  main.ts, app.module.ts
  config/              env.ts (Zod), ConfigModule
  common/              shared kernel, importable by every module
    errors/            DeckClubError, notImplemented()
    http/              Fastify ⇄ web Request bridge, FetchFunction
    mcp/               McpCaller, @McpFeature, registerTool / registerResource / registerPrompt, widget URIs
    health/            @HealthCheck probe contract
    discovery/         discoverProviders()
  infra/deck-club-api/ DeckClubApiClient: the only way to the core API
  modules/
    mcp-server/        POST /mcp: origin check → auth gate → client naming → createMcpHandler
    auth/              OAuth 2.1 resource server (domain · application · infrastructure · http · testing)
    health/            GET /health, GET /health/ready
    decks/             list_decks … delete_cards, deck + guide resources, make_cards prompt
                       application/ports/ + infrastructure/ hold the port to the core API
    study/             get_due_cards, submit_review, get_stats, today resource, quiz_me, find_weak_spots
    clubs/             list_clubs, suggest_club_cards, create_battle
    widgets/           MCP Apps views (ui://deck-club/*.html)
```

A feature module is `application/` (use cases and, once built, ports to the
API) plus `mcp/` (the driving adapter that registers the tools). It marks its
adapter with `@McpFeature()`; the `mcp-server` module discovers every marked
provider at runtime, so adding a module to `AppModule` is all it takes to
serve it. Health probes work the same way with `@HealthCheck()`. Modules meet
only through facades (`AuthFacade`); `eslint-plugin-boundaries` enforces it.

## One request

1. `POST /mcp` with `Authorization: Bearer <token>`.
2. **Origin** (DNS-rebinding protection): a browser `Origin` must be a
   localhost host, the host of `MCP_PUBLIC_URL` or in `MCP_ALLOWED_ORIGINS`;
   requests without one (every non-browser client) pass. Otherwise 403.
3. **Auth gate** (`AuthFacade`): the SDK's `verifyBearerToken` with the
   Supabase verifier. Missing or bad token → 401 with
   `WWW-Authenticate: Bearer … resource_metadata="…/.well-known/oauth-protected-resource/mcp"`.
   Supabase unreachable → 503 with `Retry-After`, never a false 401.
4. **Client name** for provenance ("Added by Claude"): the request's
   `_meta` envelope (2026-07-28), else the name remembered from this token's
   `initialize` (2025 era), else the User-Agent.
5. **`createMcpHandler`** builds a server for this request from every feature
   module and answers with JSON or SSE.
6. **Tool call**: the SDK validates arguments with the contracts schema
   (invalid → tool error); `registerTool` checks the tool's scope (missing →
   `REJECTED: FORBIDDEN`), runs the use case and maps a `DeckClubError` to
   `REJECTED: <CODE>. <detail>`. When the API refuses an input it lists the
   field problems, and they are relayed too
   (`REJECTED: VALIDATION_FAILED. … Fix: title: Too long.`), so the AI can
   correct its call; `describeRefusal()` is the one place refusals are
   written. Unexpected errors become `REJECTED: INTERNAL` without their
   message.

## The published interface

Names, scopes and input schemas live in `packages/contracts`
(`mcp-tools.ts`, `mcp-prompts.ts`, `mcp-resources.ts`); AI-facing titles and
descriptions live next to each module's adapter (`*-tool-specs.ts`).

| Tool                 | Scope       | Module | View           |
| -------------------- | ----------- | ------ | -------------- |
| `list_decks`         | decks:read  | decks  | deck library   |
| `get_deck`           | decks:read  | decks  | deck           |
| `search_cards`       | decks:read  | decks  | search results |
| `create_deck`        | decks:write | decks  | deck created   |
| `add_cards`          | decks:write | decks  | deck           |
| `update_card`        | decks:write | decks  |                |
| `delete_cards`       | decks:write | decks  |                |
| `get_due_cards`      | study       | study  | study session  |
| `submit_review`      | study       | study  |                |
| `get_stats`          | study       | study  | stats          |
| `list_clubs`         | clubs       | clubs  |                |
| `suggest_club_cards` | clubs       | clubs  |                |
| `create_battle`      | clubs       | clubs  |                |

Prompts: `make_cards`, `quiz_me`, `find_weak_spots`. Resources:
`deck-club://decks/{deckId}`, `deck-club://study/today`,
`deck-club://guides/card-writing`, and the views
`ui://deck-club/{deck,study-session,stats}.html`.

**Scopes.** Supabase's OAuth server issues only OpenID scopes, so Deck Club
scopes are a grant made in Deck Club, per AI connection, not a token claim.
`grantedScopes()` (auth domain) is the one seam: today every verified user
token holds every scope; once AI connections store grants, it reads them.
The protected resource metadata therefore does not advertise Deck Club
scopes, which Supabase would refuse to issue.

## Supabase setup

The MCP server is only the resource server. For AI clients to sign in, the
Supabase project must act as an OAuth 2.1 authorization server:

1. **Authentication → OAuth Server**: enable it.
2. Turn on **dynamic client registration**: MCP clients register themselves.
3. Set the **authorization path** to the web app's consent page, e.g.
   `/oauth/consent` on the Site URL.
4. Use **asymmetric JWT signing keys** (Project Settings → JWT Keys), so
   tokens are verified locally against the published JWKS.

`GET /health/ready` reports `supabase-auth: down` with "The Supabase OAuth 2.1
server is not enabled for this project." until step 1 is done.

**Still to build:** the consent page (step 3) in `apps/web`. Supabase
redirects the user there with an `authorization_id`; the page shows the AI
client and the Deck Club scopes and calls
`supabase.auth.oauth.approveAuthorization` / `denyAuthorization`. Until then
the full OAuth flow stops at that redirect, and the pasted token from
**Connect your AI** keeps working: a web session token is a valid Supabase
user token and passes the same gate.

## Reading a deck: pages and cursors

`get_deck` returns the deck and **one page of up to 25 cards**
(`DECK_PAGE_SIZE`), so a large deck never floods the AI's context. The core
API answers `GET /decks/:id/cards` with every card, so the MCP server cuts the
page (`decks/application/deck-page.ts`). The next page is reached with
`nextCursor`: an opaque value bound to the deck. A cursor the AI made up, or
one from another deck, is refused with `REJECTED: VALIDATION_FAILED` and a
sentence telling it to start again without one. A cursor past the end (cards
deleted meanwhile) is an empty last page, not an error. The deck itself is
fetched with the caller's token, so another user's deck answers
`DECK_NOT_FOUND`, exactly as in the web app.

## Searching cards

`search_cards` is what an AI calls before `add_cards`, to avoid writing a
card the user already has (spec 9). **What counts as a match is a business
rule, so it lives in the API** (`apps/api/src/modules/decks/domain/card-search.ts`),
where `add_cards` duplicate detection and the web app's search will use the
same rule:

- every word of the search must appear on the card (front, back, extra or
  tags), ignoring case and accents ("cafe" finds "Café"), in any script;
- results are ranked: a word on the front outweighs one on the back, the
  search found as written scores higher, and a card whose front **is** the
  search comes first — the likely duplicate;
- only decks the user may manage are searched, so another user's cards can
  never match; a deck filter naming someone else's deck is `DECK_NOT_FOUND`.

The API serves it as `GET /cards/search?q=&deckId=&limit=` (20 results by
default, 50 at most, with the total number of matches). The MCP tool relays
it, returns text that says plainly when nothing matched ("safe to add"), and
logs the search by counts only: the words a user searches for are their
content and never reach a log line. Matching reads the user's cards in
process; an SQLite FTS index is the path when libraries grow large.

## Creating a deck

`create_deck` is the first tool that writes. Its input is the web form's
schema (`CreateDeckInputSchema`: trimmed plain-text title, language code, up
to 10 tags normalised to lowercase and de-duplicated), so the AI and the UI
cannot validate differently, and invalid input never reaches the API. The
API takes the owner from the token and creates the deck **private**. The
tool needs `decks:write`; `decks:read` alone is refused with `FORBIDDEN`.
The result gives the AI the new id for `add_cards` and the link to share;
the log line keeps the deck id, language and tag count — never the title or
description. There is no idempotency key on `create_deck` yet (spec 9 asks
for one on writes; the API has none), so the description tells the AI to
check `list_decks` first and not to call it twice for one request.

## Views (MCP Apps)

A view is one self-contained HTML document served as a `ui://` resource, so
a host can render it in a sandboxed iframe with no network of its own.

- **Shared building blocks** (`modules/widgets/views/`), so every view looks
  and behaves the same:
  - `brand.ts`: the stylesheet (tokens, typefaces, sticker buttons, chips,
    the ruled index card, the highlighter swipe);
  - `components.ts`: escaped HTML builders (`pageHeader`, `actionButton`,
    `chip`, `notice`, `emptyState`, `countLabel`);
  - `host-actions.ts`: every button carries `data-action`/`data-value`;
    `open` and `ask` work everywhere, anything else is a view's own action;
  - `card-components.ts`: `indexCard()`, the ruled index card every card
    view shows (sides, extra, chips, optional highlight and buttons);
  - `deck-components.ts`: `deckTile()`, a deck as its library tile (tab in
    the deck's pastel, title, language, card count, extra chips, buttons);
  - `highlight.ts`: marks search words in escaped text with the brand's
    highlighter, ignoring case and accents like the search (presentation
    only: which cards match is the API's decision);
  - `chat-messages.ts`: what a view asks the assistant in the user's words;
  - `tool-output.ts`: reads a tool result a view fetched itself, with the
    tool's contracts schema;
  - `deck-accent.ts`, `escape-html.ts`;
  - `browser/view-runtime.ts`: the only DOM code. `startView()` connects to
    the host, renders the tool result after parsing it with the tool's
    contracts schema, wires buttons and forms (`data-action`) and disables
    a control while its action runs; `callThroughHost()` calls a Deck Club
    tool through the host (`serverTools`) or, on hosts without it, sends the
    request as a chat message. A view entry (`browser/*.view.ts`) is just a
    definition.

- **The brand, in the chat.** `widgetDocument` wraps every view in the web
  app's tokens, motifs and both typefaces (`views/brand.ts` mirrors
  `apps/web/src/app/globals.css`). A deck's pastel tab is computed with the
  same hash as the web library, so a deck looks the same in both places.
  Fonts come from Google Fonts, the only domains the view's
  `_meta.ui.csp.resourceDomains` allows, and fall back to the system stack
  if a host blocks them. Light mode only, by brand decision.
- **The deck view** (`ui://deck-club/deck.html`) renders `get_deck` like the
  deck's page in the web app: the title on the deck's own pastel, then each
  card as a ruled index card with its front, back and extra, and chips for
  Reversible, tags and "Added by Claude". "Show more cards" calls `get_deck`
  with the cursor **from the view, through the host** (`tools/call`, when the
  host advertises `serverTools`), validates the page and appends it; a host
  without that capability gets the request as a chat message instead. "Quiz
  me on this deck" and "Open in Deck Club" ask the assistant and open the web
  app. Markup in `deck-markup.ts`, entry in `browser/deck.view.ts`.
  `add_cards` links this view too: when it is built it must return the same
  `GetDeckOutputSchema` shape (the deck with the cards just added); until
  then its refusal shows the view's notice.
- **The deck created view** (`ui://deck-club/deck-created.html`) renders
  `create_deck`: "Deck created" on the deck's own pastel, the deck as the
  tile it now is in the library (with "Private" and its tags), and a panel
  whose main action is the next step — a new deck is empty — "Add 10 cards"
  or "Use my notes", both asked of the assistant, plus links to the deck and
  the library. Markup in `deck-created-markup.ts`, entry in
  `browser/deck-created.view.ts`.
- **The search results view** (`ui://deck-club/search-results.html`) renders
  `search_cards`: a search box holding the words, then each match as an
  index card with its deck (a chip in the deck's own pastel), the words
  marked, and a button to open the deck. Typing new words runs
  `search_cards` again from the view, in the same scope, through the host.
  With no match it says there is no card about it yet and offers to make
  some. Markup in `search-results-markup.ts`, entry in
  `browser/search-results.view.ts`.
- **The deck library view** (`ui://deck-club/deck-library.html`) renders the
  `list_decks` result: one index card per deck with its card count and
  language, a button to open the deck in Deck Club (`ui/open-link`) and one
  that asks the assistant for more cards (`ui/message`). Its markup is a
  pure function (`deck-library-markup.ts`), tested on its own and escaping
  every deck title. "Add cards" asks the assistant in the user's own words, so
  it will land on `add_cards` and be refused with `NOT_IMPLEMENTED` until
  that tool is built.
- **Build.** `pnpm build` (and `pnpm build:views`) bundles each entry in
  `VIEW_ENTRIES` (`deckLibrary`, `deck`, `searchResults`, `deckCreated`) with
  esbuild into
  `dist/views/<widget>.js`, which
  `BundledWidgetViews` inlines into the document and caches. A view without
  a bundle falls back to the branded placeholder, so a tool that links to a
  view never fails because of it. The bundle is ~660 kB: a view embeds the
  MCP Apps client, as every MCP Apps view does.
- **Data.** Each tool with a view declares `outputSchema`
  (`ListDecksOutputSchema`, `GetDeckOutputSchema`, `SearchCardsOutputSchema`,
  `CreateDeckOutputSchema`),
  the SDK validates the
  `structuredContent` it returns, and the view parses it again with the same
  contracts schema before rendering — one validator on both sides, and
  nothing rendered that it could not read.

## Health

| Endpoint            | Meaning                                         | Status codes |
| ------------------- | ----------------------------------------------- | ------------ |
| `GET /health`       | Liveness: the process serves HTTP. Never flaps. | 200          |
| `GET /health/ready` | Readiness: every `@HealthCheck()` probe passes. | 200 / 503    |

Probes today: `api` (the core API's `/health`) and `supabase-auth` (the
authorization server's metadata). Each runs with a 3 s timeout; a report
lists every check with its latency and, when down, a fixed reason (never an
exception message). The Docker `HEALTHCHECK` uses liveness.

## Configuration

| Variable                   | Default                     | Purpose                                            |
| -------------------------- | --------------------------- | -------------------------------------------------- |
| `MCP_PORT`                 | `4100`                      | Listen port                                        |
| `MCP_PUBLIC_URL`           | `http://localhost:4100/mcp` | Public endpoint URL; the OAuth resource id         |
| `SUPABASE_URL`             | required                    | The project; its Auth is the authorization server  |
| `SUPABASE_PUBLISHABLE_KEY` | `NEXT_PUBLIC_…` fallback    | Public key for the Supabase client                 |
| `API_INTERNAL_URL`         | `http://localhost:4000`     | The core API                                       |
| `WEB_PUBLIC_URL`           | `http://localhost:3000`     | Links and the documentation URL                    |
| `MCP_ALLOWED_ORIGINS`      | none                        | Extra browser origins (hostnames, comma-separated) |

## Building a tool (the recipe)

`list_decks`, `get_deck`, `search_cards` and `create_deck` are the worked
examples (`search_cards` also adds its API endpoint, for a capability the API
did not have; `create_deck` is the write): follow
`decks/application/ports/decks-api.ts`, `decks/infrastructure/http-decks-api.ts`,
`DecksService.listDecks`/`getDeck`, `deck-library-view.ts` and
`deck-detail-view.ts`.

1. The input schema already exists in `packages/contracts`; add a response
   schema there if the API endpoint is new.
2. In the module's `application/`, add a port (e.g. `DecksApi`) and, in
   `infrastructure/`, its adapter over `DeckClubApiClient` (`send()` with the
   caller's token and client name, a contracts schema for the answer).
3. Replace the use case's `notImplemented(...)` with the call and format the
   reply: short text for the model, `structuredContent` for the view.
4. Tests: the use case against a fake port (happy path and two refusals
   asserting the code), the adapter against a stubbed `FetchFunction`, and
   the contract test in `test/mcp.contract.test.ts`.
5. If the tool has a view: declare the `outputSchema`, write the markup as a
   pure function in `views/` from the shared components, add an entry in
   `views/browser/` that calls `startView()` with the contracts schema, and
   list it in `VIEW_ENTRIES`. Test the markup (including escaping) and add the
   contract test that reads the view.
