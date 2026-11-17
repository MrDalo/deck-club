---
description: Testing conventions — every feature has unit tests; which level a change needs; colocated Vitest files; in-memory port adapters; HTTP tests on in-memory SQLite; MCP contract tests with the real SDK client; jsdom component tests; titles that name the rule. Loaded for test files.
paths:
  - '**/*.test.ts'
  - '**/*.test.tsx'
  - '**/test/**'
  - '**/testing/**'
---

# Testing

**Every feature ships with unit tests.** A change without a test for its new
behaviour is not done (`docs/definition-of-done.md`).

| Level         | Tool                                              | When                                                          | Where                              |
| ------------- | ------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------- |
| Schema        | Vitest                                            | Any refinement, default or transform in contracts             | `packages/contracts/src/*.test.ts` |
| Domain        | Vitest                                            | Any rule in `domain/`                                         | colocated                          |
| Use case      | Vitest + in-memory adapters (test kit)            | Every application service method                              | colocated `*.service.test.ts`      |
| HTTP          | Vitest + Nest + Fastify inject, SQLite `:memory:` | Every route; round-trips every column                         | `apps/api/test/*.http.test.ts`     |
| MCP contract  | Vitest + MCP SDK `Client` over real HTTP          | Every tool in `MCP_TOOL_NAMES`, auth, refusals                | `apps/mcp/test/*.contract.test.ts` |
| Web logic     | Vitest (node)                                     | Every `lib/` function, query factory, API helper              | colocated `*.test.ts`              |
| Web component | Vitest + Testing Library (jsdom)                  | Forms and flows with behaviour (validation, keyboard, states) | colocated `*.dom.test.tsx`         |
| E2E           | Playwright (to add with the review slice)         | The spec 4 main flows                                         | `e2e/`                             |

## Rules

- **Every use case: a happy path and at least two rejection tests**, each
  asserting the error `code` (`toMatchObject({ code: 'DECK_NOT_FOUND' })`).
- **Titles describe behaviour and name the rule**: `rejects adding cards to
another user's deck with DECK_NOT_FOUND`.
- **Use the port's in-memory adapter or the module's test kit**; never mock a
  port ad hoc with `vi.fn()`. Global `fetch` may be stubbed at an adapter
  boundary (`vi.stubGlobal`) and always unstubbed after.
- **Expected values come from the spec or contracts limits**, not from the
  module under test re-deriving them.
- **Share setup, never assertions.** Reuse `createDecksTestKit`,
  `createTestApp`, `FakeDeckClubApi`; copying one means it should be shared.
- **Component tests** render with `NextIntlClientProvider` (English messages)
  and a fresh `QueryClient`; query by role and label, the way a screen reader
  does.
- No `any`, no test-only production APIs, no snapshot tests of markup.
- A bug fix starts with a failing test that reproduces it.

## Scoping

Per edit: the touched package (`pnpm turbo run test --filter=<pkg>`). A
change in `packages/contracts` or `packages/config` runs **every** package.
Before every commit: full `pnpm test`. See `verification-gates`.
