# Definition of Done

One list, cited by `feature-workflow`, every implementer brief and every
review. A line that does not apply is marked "n/a" in the task's audit, not
skipped silently.

## Every change

- [ ] Gates green: `pnpm format:check`, `pnpm typecheck`, `pnpm lint` (zero
      warnings), scoped tests with the blast-radius rule, `pnpm deadcode`.
- [ ] **Every feature has unit tests**: each new use case has a happy path and
      at least two rejection tests asserting the error `code`; each new pure
      function, hook with logic and query factory has a colocated test; each
      new route has an HTTP test; each new MCP tool has a contract test.
- [ ] It is a vertical slice: one capability through every layer it needs,
      nothing built ahead of its use; parity between UI and MCP holds.
- [ ] Reviewed before commit by the routed panel (`pre-merge-review`);
      blockers and majors recorded in `docs/review-findings.md`.
- [ ] The demo ran and its evidence is named (tests, browser check at
      1440×900 and 390×844, dogfood transcript).
- [ ] Names are glossary words; sizes inside `45-code-structure`; JSDoc on
      every export.
- [ ] Docs true to the code: README, `docs/architecture.md`, the roadmap, an
      ADR for a decision on the `00-core` confirmation list.

## Behaviour and data

- [ ] Every boundary input parsed by a `packages/contracts` schema; no `any`.
- [ ] Business rules only in the API's `domain/`; the web app and MCP server
      only parse, call and show.
- [ ] A new column round-trips through the real adapter in an HTTP test; a
      migration is generated and committed.
- [ ] A new query has its index.

## Errors and security

- [ ] Every new error has an `ERROR_CODES` entry, a human `detail` and a test.
- [ ] `security-baseline` regression list walked for auth, input, forwarding,
      env or infra changes.
- [ ] No secret in code, logs, images or `NEXT_PUBLIC_*`.

## Web

- [ ] Every string in `en`, `sk` and `cs`.
- [ ] WCAG 2.2 AA: labels, focus, roles, keyboard path, contrast.
- [ ] Mobile-first; works at 390 px wide.

## MCP

- [ ] Tool description follows `mcp-tool-surface`; refusals read as
      `REJECTED: <CODE>. <detail>`; `learner-advocate` reviewed it.
