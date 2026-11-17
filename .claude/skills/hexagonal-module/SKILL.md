---
name: 'hexagonal-module'
description: 'Use when adding or extending a backend module in apps/api (study, clubs, battles, settings…) or a tool module in apps/mcp: the folder shape, the order to build it in, ports and in-memory adapters, facades, wiring, migrations and the tests each layer needs. Modelled on apps/api/src/modules/decks.'
---

# Adding a hexagonal module

The reference implementation is `apps/api/src/modules/decks`. Copy its shape.

## Order

1. **Contracts first** (`contracts-steward`): request/response schemas, DTOs,
   error codes for the module.
2. **Domain** — `domain/<entity>.ts`: the entity type and pure functions
   (`createX`, `applyXPatch`, `canDoY`). No Nest, no I/O, no `Date.now()`
   (take `now: Date`). Colocated tests.
3. **Ports** — `application/ports/<thing>-repository.ts`: a `type` with async
   methods plus `export const THING_REPOSITORY = Symbol('THING_REPOSITORY')`.
4. **In-memory adapter** — `infrastructure/memory/…`, then a test kit in
   `testing/` that wires the services to it with `AdvanceableClock` and
   sequential ids.
5. **Use cases** — `application/<thing>.service.ts`, `@Injectable()`,
   dependencies via `@Inject(TOKEN)`. One method per use case, shape: load →
   check access → domain → persist → DTO. Tests on the kit: happy path + two
   rejections asserting `code`.
6. **Schema + Drizzle adapter** — `infrastructure/drizzle/<module>.schema.ts`
   (index every filter column) and the repository class. Ask the orchestrator
   to run `pnpm db:generate`; commit the SQL.
7. **HTTP** — `http/<thing>.controller.ts` with `@UseGuards(AuthGuard)`,
   `@CurrentUser()`, `parseBody(Schema, body)`, `parseId(raw, notFound())`.
   No logic.
8. **Facade** — `<module>.facade.ts`: the async methods other modules need,
   returning DTOs. Only add a method when a consumer exists.
9. **Module** — `<module>.module.ts`: providers bind tokens to Drizzle
   adapters, `CLOCK`, `ID_GENERATOR`; `exports: [<Module>Facade]`. Import it in
   `app.module.ts`.
10. **HTTP tests** — `apps/api/test/<module>.http.test.ts` on `createTestApp()`
    (real SQLite in memory): auth, validation, ownership, a full round trip.

## Using another module

Inject its facade (import its module and use the exported facade). Never
import its `domain/`, `application/` or `infrastructure/` — lint will fail.

## MCP tool modules (apps/mcp)

Same idea, thinner: `application/ports/deck-club-api.ts` (the API port),
`application/<tools>.service.ts` returning `ToolResult` via `runTool`,
`application/tool-text.ts` and `tool-descriptions.ts`, the HTTP adapter in
`infrastructure/`, registration in `http/create-mcp-server.ts`. A new API call
gets a method on the port, the HTTP adapter (parse the response with the
contracts schema) and `FakeDeckClubApi`.
