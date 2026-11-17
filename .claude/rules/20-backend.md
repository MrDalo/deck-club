---
description: Backend rules for apps/api and apps/mcp — modular monolith, hexagonal modules (domain, application with ports, infrastructure adapters, http), facades between modules, one error type and one exception filter, timeouts on every outbound call, the MCP server as a thin client. Loaded for files under apps/api and apps/mcp.
paths:
  - 'apps/api/**'
  - 'apps/mcp/**'
---

# Backend

## The modular monolith (apps/api)

`apps/api/src` has four kinds of folder:

```
config/     env.ts (Zod-parsed at boot) and ConfigModule
common/     cross-cutting: AppError, the problem-details filter, auth guard and verifier port, Clock/IdGenerator ports
infra/      shared adapters: the database connection
modules/    one folder per bounded context: decks (now), study, clubs, battles (later)
```

Each module is hexagonal:

```
modules/<module>/
  domain/          entities and pure rules. Imports only domain/ and @deck-club/contracts types. No Nest, no I/O.
  application/     use-case services and ports/ (types + injection tokens). Orchestrates: load → check → domain → persist → DTO.
  infrastructure/  adapters: drizzle/ (production, owns <module>.schema.ts) and memory/ (test adapters)
  http/            controllers: parse input with contracts, call one use case, return its DTO
  testing/         test kits shared by the module's tests
  <module>.facade.ts   the only thing other modules may use; async, returns DTOs
  <module>.module.ts   wires ports to adapters, exports only the facade
```

ESLint (`eslint-plugin-boundaries`) enforces: no module imports another
module's `domain/`, `application/` or `infrastructure/`; `domain/` imports
nothing outside `domain/`; `common/`, `config/` and `infra/` never import a
module.

- **Every use case has one shape:** load state → check access → call domain
  functions → persist → map to DTO. A conditional that would change when the
  product rule changes belongs in `domain/`, not in a service or controller.
- **Ports** are TypeScript types plus a `Symbol` token in
  `application/ports/`. Every port has a production adapter and an in-memory
  adapter. `Clock` and `IdGenerator` are ports; never `new Date()` or
  `randomUUID()` in a use case.
- **Inject explicitly.** Every constructor parameter of a Nest class names
  its token: `@Inject(DeckService)`, `@Inject(STUDY_REPOSITORY)`. `pnpm dev`
  runs through tsx (esbuild), which emits no decorator type metadata, so a
  parameter injected by type alone is `undefined` there while tests (swc) and
  builds (tsc) pass. ESLint enforces it.
- **Facades** expose async methods returning contract DTOs, never entities or
  rows. A facade with a rule in it has become a second domain layer.
- Not every module needs ports: a pure CRUD module with no rules may be
  layered (controller → service → drizzle) — decide in the module's ADR line.

## Errors, one job per layer

- Services throw `AppError(code, detail)` with a code from `ERROR_CODES`.
  Adapters throw freely; the filter turns anything else into `INTERNAL` and
  logs it once with a `traceId`, never echoing its message.
- One global `ProblemDetailsFilter`: every error leaves as RFC 9457
  `application/problem+json` with `code`, `detail`, `traceId`.
- Missing, deleted and someone else's resources all answer `*_NOT_FOUND`;
  a malformed id too. Never reveal that something exists.
- Every route except `/health` is behind `AuthGuard`; the user comes from
  the verified token (`@CurrentUser()`), never from a body or query.

## Outbound calls

Every outbound call has a timeout (JWKS 5 s, API from MCP 10 s, API from web
10 s). No retries inside a request path; clients retry transient failures.

## The MCP server (apps/mcp)

- A **thin client** of the API (spec 5): no database, no business rules, no
  cached user data. Each tool is one or two calls through the
  `DeckClubApi` port, formatted as compact text.
- **Stateless Streamable HTTP**: a fresh `McpServer` per request, bound to
  that request's bearer token, so one user's token can never serve another.
- **A refusal is a tool result, not a protocol error**: `REJECTED: <CODE>.
<detail>` with `isError: true`. JSON-RPC errors are for auth and malformed
  calls only.
- Every write it forwards carries the AI client's name in
  `CLIENT_NAME_HEADER` for provenance.
- Tool names and input schemas come from `packages/contracts`; descriptions
  follow `mcp-tool-surface`.

## Configuration and logs

Each app parses its environment once at boot (`config/env.ts`) and exits
non-zero naming every bad variable. Logs are Nest `Logger` objects with an
`evt` field (`process.started`, `http.unhandled`); `LOG_FORMAT=json` in
containers. Never log card text, emails or tokens.
