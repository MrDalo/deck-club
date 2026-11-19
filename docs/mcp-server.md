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
interface. `list_decks`, `get_deck`, `search_cards`, `create_deck` (the
first write), `add_cards`, `update_card` and `delete_cards` (every deck
tool), and `get_due_cards`, `submit_review` and `get_stats` (every study
tool) are built end to end, each with its MCP Apps view (`submit_review` is
rated from the study session view), and `list_clubs` with its view over the
API's `GET /clubs` (see "Clubs"). The other club tools, the resources and
the prompts are interfaces only and refuse with `NOT_IMPLEMENTED` until
their slice is built.

| Capability                                                                    | State                                                      |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Stateless Streamable HTTP (both eras)                                         | Done                                                       |
| OAuth discovery, token verification, 401                                      | Done; needs the Supabase setup below                       |
| Consent screen for Supabase's OAuth flow                                      | **Not built** (web app, see "Supabase setup")              |
| Health: liveness and readiness                                                | Done                                                       |
| `list_decks` + its deck library view                                          | **Done**                                                   |
| `get_deck` + its deck view                                                    | **Done**                                                   |
| `search_cards` + its search results view (and `GET /cards/search` in the API) | **Done**                                                   |
| `create_deck` + its deck created view                                         | **Done**                                                   |
| `add_cards` + its cards added view                                            | **Done** (no duplicate skipping yet; see "Adding cards")   |
| `update_card` + its card updated view                                         | **Done**                                                   |
| `delete_cards` + its cards deleted view                                       | **Done** (no restore in the API yet; see "Deleting cards") |
| `get_due_cards` + its study session view                                      | **Done**                                                   |
| `submit_review`, rated from the study session view                            | **Done** (no correction yet; see "Recording reviews")      |
| `get_stats` + its stats view (and weak cards in `GET /study/stats`)           | **Done**                                                   |
| `list_clubs` + its club list view (and the clubs module in the API)           | **Done** (members cannot open club decks yet; "Clubs")     |
| 2 club tools, 3 prompts, 3 resources                                          | Interface only (`NOT_IMPLEMENTED`)                         |

## Layout: a modular monolith of hexagonal modules

```
apps/mcp/src/
  main.ts, app.module.ts
  config/              env.ts (Zod), ConfigModule
  common/              shared kernel, importable by every module
    errors/            DeckClubError, notImplemented(), write-retry advice for the AI
    http/              Fastify ⇄ web Request bridge, FetchFunction
    mcp/               McpCaller, @McpFeature, registerTool / registerResource / registerPrompt, widget URIs
    health/            @HealthCheck probe contract
    text/              countLabel() ("1 card", "12 members"), for the AI's text and the views
    time/              timeUntil() ("back in 3 days"), for the AI's text and the views
    web/               links into the web app (deckUrl, libraryUrl)
    discovery/         discoverProviders()
  infra/deck-club-api/ DeckClubApiClient: the only way to the core API; credentialsOf(caller) for every adapter
  modules/
    mcp-server/        POST /mcp: origin check → auth gate → client naming → createMcpHandler
    auth/              OAuth 2.1 resource server (domain · application · infrastructure · http · testing)
    health/            GET /health, GET /health/ready
    decks/             list_decks … delete_cards, deck + guide resources, make_cards prompt
                       application/ports/ + infrastructure/ hold the port to the core API
    study/             get_due_cards, submit_review, get_stats, today resource, quiz_me, find_weak_spots
                       application/ports/ + infrastructure/ hold the port to the core API
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

| Tool                 | Scope       | Module | View            |
| -------------------- | ----------- | ------ | --------------- |
| `list_decks`         | decks:read  | decks  | deck library    |
| `get_deck`           | decks:read  | decks  | deck            |
| `search_cards`       | decks:read  | decks  | search results  |
| `create_deck`        | decks:write | decks  | deck created    |
| `add_cards`          | decks:write | decks  | cards added     |
| `update_card`        | decks:write | decks  | card updated    |
| `delete_cards`       | decks:write | decks  | cards deleted   |
| `get_due_cards`      | study       | study  | study session   |
| `submit_review`      | study       | study  | (study session) |
| `get_stats`          | study       | study  | stats           |
| `list_clubs`         | clubs       | clubs  | club list       |
| `suggest_club_cards` | clubs       | clubs  |                 |
| `create_battle`      | clubs       | clubs  |                 |

Prompts: `make_cards`, `quiz_me`, `find_weak_spots`. Resources:
`deck-club://decks/{deckId}`, `deck-club://study/today`,
`deck-club://guides/card-writing`, and the views
`ui://deck-club/{deck-library,deck,deck-created,cards-added,card-updated,cards-deleted,search-results,study-session,stats,club-list}.html`.

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
description. Like `add_cards`, it takes an optional `idempotencyKey`, so a
retried call never makes a second deck (see "Retrying writes").

## Adding cards

`add_cards` writes 1 to 100 cards to one of the caller's decks through
`POST /decks/:id/cards/batch`, the web app's own use case, so the API stamps
each card "Added by <client>" (provenance `mcp`) from the client name the
MCP server sends. Its input is the card schema the web editor uses
(`CreateCardInputSchema`), so an invalid card (markup, a blank side, an
unknown type, more than 100 cards) is refused before anything reaches the
API.

- **All or nothing.** The API inserts a batch in one statement; a card it
  refuses comes back as `REJECTED: VALIDATION_FAILED … Fix: cards.3.front: …`
  and nothing is added.
- **The deck first.** The use case reads the deck before writing, so another
  user's deck is `DECK_NOT_FOUND` before any write, and the reply can always
  name the deck.
- **A write is never reported as a refusal.** After the batch is written the
  deck's cards are read back for the view; if that read fails, the reply is
  still a success, built from the cards as sent (logged as
  `cards.added.read_back_failed`). A refusal there would make the AI send the
  same cards again.
- **Safe retries.** The tool's `idempotencyKey` is sent to the API, so a
  retried batch is added once (see "Retrying writes").
- **The reply.** Text for the AI: the count, the deck, every new card id next
  to its front (what `update_card` and `delete_cards` will take) and the
  link. Structured content: a `get_deck` page that starts at the first new
  card (`AddCardsOutputSchema` = `GetDeckOutputSchema` plus `addedCount`), so
  the view reads the rest of a large batch with `get_deck` and the cursor. A
  batch shares one timestamp, and the API orders it by id, so the page is
  found by reading the deck back, not by assuming the order sent.
- **Logs** keep the deck id, the count, the client and whether the call was
  a replay, never card content or the key.

**Not built yet:** skipping likely duplicates (spec 9: "created, skipped as
duplicate, and invalid"; it belongs in the API's domain next to the search
rule). The tool description says so plainly: check with `search_cards`
first.

## Editing a card

`update_card` changes a card's front, back, extra or tags through
`PATCH /decks/:id/cards/:cardId`, the web editor's own use case. Its input
is the editor's schema (`UpdateCardInputSchema`, with the deck and card
ids): only the fields sent change, at least one must be sent, `tags`
replaces all of the card's tags, and the card's type cannot change (spec 3).
The API keeps the card's author ("Added by Claude") and every learner's
study state, which belongs to the card's id, not its content.

- **The card first.** The use case reads the deck and its cards before
  writing: that gives the card as it was, and a card id that is not in the
  deck is refused with `CARD_NOT_FOUND` (telling the AI to look it up with
  `get_deck` or `search_cards`) before anything is written.
- **What changed.** The reply compares the card as it was with the card the
  API answered with (trimmed text, lowercase tags), not with what the AI
  sent. The AI reads each change as `- back: "to speak" → "to talk"`, which
  is what it needs to undo the edit if the user asks, and "already had
  these values; nothing changed" when that is so.
- **Retries are safe.** Setting the same values twice gives the same card,
  so an unconfirmed edit (`UPSTREAM_UNAVAILABLE`) tells the AI that calling
  again with the same arguments is safe; no idempotency key is needed.
- **Logs** keep the deck and card ids and the names of the changed fields,
  never their content.

## Deleting cards

`delete_cards` deletes 1 to 100 cards of one deck. The API deletes one card
per call (`DELETE /decks/:id/cards/:cardId`, 204) and only marks it deleted
(spec 3), so the tool calls it once per card, in the order asked for. There
is **no way to restore a deleted card yet** — no API endpoint, no screen in
the web app — so the tool description no longer promises one: it tells the
AI to confirm with the user first, naming the cards, and that deleted cards
can only be added back as new cards, with their study progress starting
over.

- **The deck first.** The use case reads the deck and its cards: another
  user's deck is `DECK_NOT_FOUND` before anything is deleted, and the reply
  can give each deleted card in full.
- **Every id gets an answer.** Repeated ids count once. An id not in the deck
  (already deleted, or never there) is reported as `notFound`, not refused,
  so a retry after a lost answer simply reports the cards already gone. A
  card the API no longer finds while deleting counts the same way.
- **Part-way is still an answer.** If Deck Club stops part-way (unreachable,
  token expired), the cards deleted so far are reported and the rest are
  listed as `notDeleted`, with "calling delete_cards again with these ids is
  safe" (logged as `cards.delete_stopped`). Only when nothing was deleted is
  the call refused, with a detail saying the retry is safe.
- **The deleted cards, in full.** The AI's text lists each deleted card's id,
  type, front, back, extra and tags: while the API cannot restore cards,
  that is the only copy it has if the user wants them back.
- **Logs** keep the deck id and the counts, never card content.

## Due cards

`get_due_cards` is how a quiz in the chat starts (spec 4.5). It relays
`GET /study/due`, so **which cards are due, their order and the daily limits
are the API's** (`apps/api/src/modules/study/domain/session-queue.ts`): the
session order of spec 6, 20 new cards and 200 reviews per deck per day, the
day boundary and the sibling rule. A chat session and a session in the app
see the same queue.

- **One deck or all.** With a `deckId`, the deck is read alongside the due
  cards (`GET /decks/:id`), so the reply names the deck even when nothing is
  due, tells a deck with no cards from one that is done for now, and can link
  to it. Another user's deck is `DECK_NOT_FOUND`, from either read.
- **Oriented cards.** The API turns each card for its direction: `prompt`
  is what to ask, `answer` what to recall, so a reversible card asked from
  its back needs nothing special here. The hints the API adds (`nextDue`,
  when the card comes back for each rating) are kept for the view's rating
  buttons, with `asOf`, the moment they count from.
- **The reply.** Text for the AI: how many cards are due and in what scope,
  one line per card with its state, deck, the deck id, card id and
  direction that `submit_review` takes, both sides, and the quiz rules (one
  card at a time, never the answer first, record every rating with a new
  idempotencyKey). When more are due than were asked for, it says how many
  wait and to call again once these are recorded. Structured content:
  `GetDueCardsOutputSchema` (the deck or null, the cards, `totalDue`, the
  library link, `asOf`).
- **Logs** keep the scope, the deck id and the counts, never a prompt, an
  answer or a deck title.

## Recording reviews

`submit_review` records how well the user remembered one card side through
`POST /study/reviews`, the app's own use case: the same FSRS engine, the
same schedule, stamped with the AI client as its source (spec 6: MCP
reviews count for streak and league). The deck, the card and the side are
checked by the API, so nothing is read first and a rating stays one round
trip: another user's deck is `DECK_NOT_FOUND`, a card not in it
`CARD_NOT_FOUND`, the reverse side of a basic card `DIRECTION_NOT_STUDIED`.

- **Never rated twice.** The API records a review for any card at any
  time, so a retried call without a key rates the card again. The tool
  takes an `idempotencyKey` (see "Retrying writes"), and its description,
  the quiz rules in `get_due_cards` and the server instructions all ask for
  a new one per rating. An unconfirmed rating with a key says to call again
  with the same key; without one it says to check `get_due_cards` first
  and never to repeat an "again" (a card rated "again" stays due).
- **The reply.** Text for the AI: what was recorded for which card, its new
  state, when it comes back ("in 3 days", with the timestamp), and that a
  card in learning comes back in today's session. A replay says first that
  nothing was recorded twice. Structured content: `SubmitReviewOutputSchema`
  (the API's review, the deck id, `replayed`, and `asOf`, the moment
  `nextDueAt` counts from), read by the study session view.
- **No view of its own.** In a quiz run in the chat the AI calls it once
  per card, and a view per call would fill the conversation; the rating UI
  is the study session view, which calls it through the host.
- **Logs** keep the deck and card ids, the side, the rating, the new state,
  the client and `replayed`, never card content or the key.

**Not built yet:** correcting a rating ("mark that as again" after the
fact). The API can undo the last rating of the day
(`POST /study/reviews/undo`), but no tool exposes it; today a correction is
a second review.

## Stats

`get_stats` answers "how am I doing?" (spec 6, 9). It reads `GET /study/stats`
and `GET /study/today` in parallel, so every number is the API's and means
what it means in the app: the streak (a day not studied yet does not break
it), reviews today and in total, 30-day retention (the share of reviews of
cards in review that were remembered), and what is still due today, in total
and per deck, within today's limits.

- **Weak cards are the API's rule.** `GET /study/stats` carries
  `weakCards`: each card side rated Again at least twice in the last 30 days
  (`WEAK_CARD_RULE` in contracts), the most forgotten first, then the most
  recently forgotten, at most 5, oriented like a due card. The rule is a
  pure function in the API's study domain (`domain/weak-cards.ts`); the
  content comes through the decks facade, so a deleted card is never shown
  from the review log. Added in this slice, as `search_cards` added its
  endpoint: the field is additive.
- **The reply.** Text for the AI: the streak and whether today still counts
  for it, today's done and still-due cards per deck (with the deck ids for
  `get_due_cards`), retention, the total, and each weak card with its deck
  id, card id, direction, both sides and how often it was forgotten, then
  how to help (explain, quiz when due, or a clearer card with `update_card`
  once the user agrees). The description asks the AI to encourage, never
  scold. Structured content: `GetStatsOutputSchema` (the API's stats,
  `dueToday`, `decksDueToday` with links, the library link).
- **Logs** keep numbers only (streak, today's reviews, cards still due, the
  count of weak cards), never a card or a deck title.

## Clubs

`list_clubs` lists the clubs the user belongs to (spec 7, 9): each club's
name and description, the user's own role (owner, admin or member, which
says what they may do there), how many members it has, and the decks it
shares. It reads `GET /clubs` with the user's token.

- **The API's clubs module** (`apps/api/src/modules/clubs`) serves it, to
  the contract in `packages/contracts` (`ClubListSchema` in `club.ts`):
  only what a member may see in the app (spec 9): the caller's own role,
  the member count rather than the members, and the invite code only for
  owners and admins, otherwise `null`. Clubs are created (`POST /clubs`),
  joined with their invite code (`POST /clubs/join`, at most 100 members)
  and given decks by their owners and admins (`POST /clubs/:clubId/decks`)
  in the API; no MCP tool or web screen does those yet.
- **Shared decks stay their author's** (ADR 0010): a club links to decks its
  owners and admins own, so the counts are real and the author keeps
  adding cards. A member cannot yet open or study a club deck they do not
  own (`get_deck` and `get_due_cards` answer `DECK_NOT_FOUND`); that is the
  next club slice.
- **The reply.** Text for the AI: one block per club with its id, the
  user's role, "12 of 100 members", the visibility, the invite code when
  present, and each shared deck with its id, language and card count.
  Structured content: `ListClubsOutputSchema` (each club's decks are
  `DeckSummary`s with their link, the shape the deck library uses).
- **Logs** keep counts (clubs, shared decks), never a club's name or its
  invite code.

## Retrying writes

The write tools that are not safe to repeat, `create_deck`, `add_cards` and
`submit_review`, take an
optional `idempotencyKey` (`IdempotencyKeySchema`: 8 to 128 letters, digits,
dashes and underscores). The tool descriptions and the server instructions
ask the AI for a new key, such as a UUID, on every call, and to reuse it
only to retry that same call.

- **Forwarded, never invented.** The MCP server sends the AI's key to the
  API as the `Idempotency-Key` header (ADR 0009), never in the body, and
  sends none when the AI gave none. It does not make one up: a retry is a
  new tool call, so a key the server chose would differ each time.
- **A retry is answered, not repeated.** The API answers a repeated call with
  the first call's result and `Idempotent-Replayed: true`
  (`DeckClubApiClient.sendIdempotent`). The tool replies as usual, but its
  first line tells the AI nothing was written twice ("Already done: an
  earlier add_cards call with this idempotencyKey added these cards…"), so
  it does not report 40 cards added when 20 were.
- **Refusals say how to recover** (`explainWriteRefusal`), in the words of
  the tool's argument rather than the HTTP header:

  | API answer                         | What the AI is told                                                                                                 |
  | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
  | `UPSTREAM_UNAVAILABLE`, with a key | the write was not confirmed; call the tool again with exactly the same arguments and key: it is never done twice    |
  | `UPSTREAM_UNAVAILABLE`, no key     | the write was not confirmed; check first (`get_deck` for cards, `list_decks` for a deck) so nothing is done twice   |
  | `IDEMPOTENCY_KEY_IN_USE` (409)     | an earlier call with this key is still running; wait a few seconds, then call again with the same arguments and key |
  | `IDEMPOTENCY_KEY_REUSED` (422)     | the key was used for a different call; use a new key for a new call                                                 |

  The server instructions let the AI retry a refusal when its detail says
  to; otherwise it does not retry a refusal unchanged.

- **Not logged.** Keys never reach a log line; `cards.added` and
  `decks.created` record `replayed`.

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
  app. Markup in `deck-markup.ts`, entry in `browser/deck.view.ts`; "Show
  more cards" is shared with the cards added view (`browser/deck-pages.ts`).
- **The deck created view** (`ui://deck-club/deck-created.html`) renders
  `create_deck`: "Deck created" on the deck's own pastel, the deck as the
  tile it now is in the library (with "Private" and its tags), and a panel
  whose main action is the next step — a new deck is empty — "Add 10 cards"
  or "Use my notes", both asked of the assistant, plus links to the deck and
  the library. Markup in `deck-created-markup.ts`, entry in
  `browser/deck-created.view.ts`.
- **The cards added view** (`ui://deck-club/cards-added.html`) renders
  `add_cards`: "N cards added" on the deck's own pastel, the deck and its new
  count, then each new card as a ruled index card numbered where it sits in
  the deck, with its "Added by Claude" chip. For a batch larger than a page it
  says how many are on screen and "Show more cards" reads the rest with
  `get_deck` through the host. A panel offers the next step — "Quiz me on
  this deck", "Add 10 more" (both asked of the assistant) and the deck in
  Deck Club — and reminds the user the assistant can fix or remove a card.
  Markup in `cards-added-markup.ts`, entry in `browser/cards-added.view.ts`.
- **The card updated view** (`ui://deck-club/card-updated.html`) renders
  `update_card`: "Card updated" on the deck's own pastel (or "Card
  unchanged"), the card as it is now as a ruled index card, and a panel
  listing each change before (struck through) and after, with "Before:" and
  "After:" for screen readers; an empty value reads as an italic _Empty_ or
  _No tags_, never as the card's own text. "Undo this change" calls
  `update_card` **from the view, through the host**, with the old values of
  the changed fields only (`undoArguments`), and shows the result, which can
  be undone in turn; a host without `serverTools` gets the request as a chat
  message instead. Markup in `card-updated-markup.ts`, entry in
  `browser/card-updated.view.ts`.
- **The cards deleted view** (`ui://deck-club/cards-deleted.html`) renders
  `delete_cards`: "N cards deleted" on the deck's own pastel with its new
  count, each deleted card on a dashed slip (labelled for screen readers),
  the ids that were not in the deck, and, if Deck Club stopped part-way, a
  notice with "Try again" (asked of the assistant). While cards cannot be
  restored, its panel says so and offers **"Add them back as new cards"**: it
  calls `add_cards` from the view, through the host, with the cards' content
  (`addBackArguments`) and an idempotency key made from their ids
  (`addBackKey`), so a second click is answered with the first one's cards
  instead of adding them twice; the panel then reads "Added back". A host
  without `serverTools` gets the request as a chat message instead. Markup in
  `cards-deleted-markup.ts`, entry in `browser/cards-deleted.view.ts`.
- **The search results view** (`ui://deck-club/search-results.html`) renders
  `search_cards`: a search box holding the words, then each match as an
  index card with its deck (a chip in the deck's own pastel), the words
  marked, and a button to open the deck. Typing new words runs
  `search_cards` again from the view, in the same scope, through the host.
  With no match it says there is no card about it yet and offers to make
  some. Markup in `search-results-markup.ts`, entry in
  `browser/search-results.view.ts`.
- **The study session view** (`ui://deck-club/study-session.html`) renders
  `get_due_cards`: "N cards to review" (on the deck's own pastel for one
  deck), then each card's question as a ruled index card with its answer
  **face down** in a native `<details>` ("Show answer", named per card for
  screen readers), so the view never gives away what the assistant is about
  to ask. Chips give the card's state (New, Learning, Review, Relearning),
  "Back to front" for a reversible card asked from its back and, across
  decks, the deck in its pastel. Under a revealed answer, **four rating
  buttons** (Again, Hard, Good, Easy, each in its pastel and saying when the
  card comes back, "Good · 10 min") call `submit_review` **from the view,
  through the host**. The key is the session (`asOf`) and the card, not the
  rating, so a second press, a retry or the same result shown again later
  never records a second review. The card then reads "Good · Recorded · back
  in 3 days" ("Already recorded" for a replay), the focus moves to the next
  card left to rate, answers the user opened stay open, and the view tells
  the assistant which cards were rated (`ui/update-model-context`), so a
  quiz in the chat neither asks nor records them again. A host without
  `serverTools` gets the rating as a chat message instead. When every card
  is rated, "Session done" offers "Next cards" (`get_due_cards` through the
  host, same deck and size); until then a panel offers "Quiz me in the chat"
  and the deck or the library in Deck Club. Nothing due reads "All caught
  up"; a deck with no cards offers to add some. Card text is marked
  `dir="auto"` for right-to-left scripts. Markup in
  `study-session-markup.ts`, the view's state (keys, arguments, what the
  assistant is told) in `study-session-state.ts`, entry in
  `browser/study-session.view.ts`.
- **The stats view** (`ui://deck-club/stats.html`) renders `get_stats`:
  "Your progress" with a lead that encourages ("Study today to keep your
  4-day streak"), four pastel tiles (streak, today with a progress bar a
  screen reader reads as "12 of 20 done", 30-day retention, total reviews),
  what is still due today per deck (the deck in its pastel, "3 reviews · 3
  new", "Quiz me" asked of the assistant), and the cards the user keeps
  forgetting as ruled index cards with both sides, "Forgotten 3×" and "Help
  me remember it" (asked of the assistant). "Refresh" calls `get_stats`
  **from the view, through the host** and takes the focus back; a host
  without `serverTools` gets the request as a chat message. Markup in
  `stats-markup.ts`, entry in `browser/stats.view.ts`.
- **The club list view** (`ui://deck-club/club-list.html`) renders
  `list_clubs`: "Your clubs" with the count of clubs and shared decks, then
  one labelled section per club: its name and description, chips for the
  user's role (Owner, Admin, Member, each in its pastel), Private or
  Public, "12 of 100 members", and "Invite code: …" for owners and admins;
  then the club's decks as the deck library's own tiles (`deckTile`, titled
  `<h3>` under the club's heading) with "Open deck". A club with no deck says
  so; no club at all offers Deck Club. Markup in `club-list-markup.ts`,
  entry in `browser/club-list.view.ts`.
- **The deck library view** (`ui://deck-club/deck-library.html`) renders the
  `list_decks` result: one index card per deck with its card count and
  language, a button to open the deck in Deck Club (`ui/open-link`) and one
  that asks the assistant for more cards (`ui/message`). Its markup is a
  pure function (`deck-library-markup.ts`), tested on its own and escaping
  every deck title. "Add cards" asks the assistant in the user's own words, so
  it lands on `add_cards`.
- **Build.** `pnpm build` (and `pnpm build:views`) bundles each entry in
  `VIEW_ENTRIES` (`deckLibrary`, `deck`, `searchResults`, `deckCreated`,
  `cardsAdded`, `cardUpdated`, `cardsDeleted`, `studySession`, `stats`,
  `clubList`:
  every published view) with
  esbuild into
  `dist/views/<widget>.js`, which
  `BundledWidgetViews` inlines into the document and caches. A view without
  a bundle falls back to the branded placeholder, so a tool that links to a
  view never fails because of it. The bundle is ~660 kB: a view embeds the
  MCP Apps client, as every MCP Apps view does.
- **Data.** Each tool with a view declares `outputSchema`
  (`ListDecksOutputSchema`, `GetDeckOutputSchema`, `SearchCardsOutputSchema`,
  `CreateDeckOutputSchema`, `AddCardsOutputSchema`, `UpdateCardOutputSchema`,
  `DeleteCardsOutputSchema`, `GetDueCardsOutputSchema`; and
  `GetStatsOutputSchema`, `ListClubsOutputSchema`; and
  `SubmitReviewOutputSchema`, which has no view
  but is read by one),
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

`list_decks`, `get_deck`, `search_cards`, `create_deck` and `add_cards` are
the worked examples (`search_cards` also adds its API endpoint, for a
capability the API did not have; `create_deck` is the simplest write,
`add_cards` the one that must never report a write as a refusal): follow
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
