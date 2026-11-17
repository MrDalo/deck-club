---
name: 'verification-gates'
description: 'Use after substantive edits, before review, and before every commit: the canonical verification commands for the Deck Club monorepo in order, the blast-radius rule for packages/contracts and packages/config, what runs per edit, per feature and per commit, what CI runs, and what subagents must not run.'
---

# Verification gates

| Script                               | Does                                                                  | Must be             |
| ------------------------------------ | --------------------------------------------------------------------- | ------------------- |
| `pnpm typecheck`                     | TypeScript 7 (`typescript-native`) across the workspace via turbo     | zero errors         |
| `pnpm lint`                          | ESLint `--max-warnings 0` incl. boundaries, i18n literal ban, budgets | zero warnings       |
| `pnpm format:check`                  | Prettier                                                              | clean               |
| `pnpm deadcode`                      | knip: unused files, exports, dependencies                             | zero                |
| `pnpm turbo run test --filter=<pkg>` | Vitest for one package (web runs node + jsdom suites)                 | green               |
| `pnpm test`                          | every package                                                         | green before commit |
| `pnpm build`                         | contracts, api, mcp (tsc 7) and web (next build)                      | green               |

Two TypeScripts are installed on purpose: builds and typechecks run TS 7 by
path; `typescript` 5.9 stays as the API that typescript-eslint, knip and
Next's build-time check load. Always go through the scripts, never a bare
`tsc`.

## When

- **Per edit (implementer):** `pnpm typecheck`, then the touched package's
  tests.
- **Per feature (orchestrator, once after integration):** typecheck → lint →
  scoped tests with the blast-radius rule → deadcode → format:check.
- **Before every commit:** full `pnpm test`; `pnpm build` when config,
  Docker or Next config changed.

## Blast radius

`packages/contracts` and `packages/config` are imported by everything: a
change there runs **every** package's tests (and rebuild contracts first:
`pnpm turbo run build --filter=@deck-club/contracts`). Everything else is
scoped to the touched package.

## CI

`.github/workflows/ci.yml`: static (audit, format, typecheck, lint, knip),
test, build, gitleaks, and on master the three Docker images.

## Subagents never run

`pnpm install|add|remove|update`, `pnpm format` or `eslint --fix` across a
directory, `pnpm db:generate`, or any git command that changes the tree.
