# Deck Club — Claude Code Guide

> Project memory for Claude Code. Always loaded. Additive to the global
> `~/.claude/CLAUDE.md`; **this file wins on every conflict** (for example
> Prettier keeps semicolons here, and the Lendable guide one folder up does
> not apply). This file is an **index**: normative text lives in
> `.claude/rules/`, procedures and knowledge in `.claude/skills/`. When a
> summary here and its rule disagree, the rule wins and this summary is fixed.

## What this is

A free, open-source flashcard platform: spaced repetition for one learner,
clubs for groups, and an MCP server so the user's own AI assistant (Claude,
ChatGPT, Codex) can make cards and run study sessions. The app never calls an
LLM itself. Source of truth: [`docs/product-spec.md`](docs/product-spec.md)
(section numbers everywhere refer to it). Status and next slices:
[`docs/roadmap.md`](docs/roadmap.md).

## Layout

| Path                 | What                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------- |
| `apps/web`           | Next.js 16 App Router, next-intl (en, sk, cs), TanStack Query, React Hook Form + Zod    |
| `apps/api`           | NestJS core: modular monolith of hexagonal modules, SQLite via Drizzle + libSQL         |
| `apps/mcp`           | NestJS MCP server (Streamable HTTP, stateless), a thin client of the API                |
| `packages/contracts` | The only home of Zod schemas, DTO types, error codes and MCP tool inputs                |
| `packages/config`    | Shared ESLint (with boundary rules), tsconfig, Prettier and Vitest presets              |
| `compose.yml`        | The three services on the private `deck-club-private` network; only web and mcp exposed |

Auth is Supabase Auth (magic link). The web server forwards `/api/v1/*` to the
API with the session's access token; the API verifies it against the
project's JWKS. Architecture: [`docs/architecture.md`](docs/architecture.md).

## Commands

| Purpose                                  | Command                              |
| ---------------------------------------- | ------------------------------------ |
| Run everything locally                   | `pnpm dev` (needs a root `.env`)     |
| Type-check workspace (TS 7)              | `pnpm typecheck`                     |
| Lint, zero warnings, boundaries included | `pnpm lint`                          |
| Formatting                               | `pnpm format:check` / `pnpm format`  |
| Dead code (knip)                         | `pnpm deadcode`                      |
| Tests, one package                       | `pnpm turbo run test --filter=<pkg>` |
| Tests, everything (before every commit)  | `pnpm test`                          |
| Build all                                | `pnpm build`                         |
| New migration after a schema change      | `pnpm db:generate`                   |
| Whole stack in Docker                    | `pnpm stack:up` / `pnpm stack:down`  |

Package names are `@deck-club/<api|mcp|web|contracts|config>`. CI
(`.github/workflows/ci.yml`) runs format, typecheck, lint, knip, tests, build,
a secret scan and the image builds. Commit prefixes (Conventional Commits):
`feat`, `fix`, `refactor`, `test`, `docs`, `chore`.

## Rules index (`.claude/rules/`)

| Rule                | Scope                    | Enforces                                                                          |
| ------------------- | ------------------------ | --------------------------------------------------------------------------------- |
| `00-core`           | always                   | Source-of-truth order, vertical slices, confirmations, code standards, self-audit |
| `05-glossary`       | always                   | The product's words are the code's words                                          |
| `15-contracts`      | `packages/contracts`     | Single Zod source, additive-forever codes and tool names                          |
| `20-backend`        | `apps/api`, `apps/mcp`   | Modular monolith, hexagonal modules, facades, errors, timeouts                    |
| `25-data`           | schemas, migrations      | Each module owns its tables, forward-only migrations, soft delete                 |
| `30-web`            | `apps/web`               | Three layers, feature groups, i18n, brand, forms, data fetching, a11y             |
| `40-tests`          | test files               | Every feature has unit tests; which level a change needs                          |
| `45-code-structure` | `apps/**`, `packages/**` | Names are words, size budgets, no junk drawers, JSDoc on exports                  |

## Team roster (`.claude/agents/`)

Implementers write only inside their area; reviewers are read-only and run in
parallel on one diff.

| Task shape                                                         | Agent                 |
| ------------------------------------------------------------------ | --------------------- |
| Plan lanes, map ownership, name the shared surface                 | `architect`           |
| Use case, port, adapter, module, migration, controller, MCP tool   | `backend-dev`         |
| Screen, feature group, route, form, query hook, translation, UI    | `frontend-dev`        |
| Schema, DTO, error code, MCP tool input                            | `contracts-steward`   |
| Tests at any level, failing test for a bug                         | `tester`              |
| General correctness review                                         | `reviewer`            |
| Auth, tokens, forwarding, input handling, secrets                  | `security-reviewer`   |
| Import drift, wrong layer, dead exports                            | `structure-auditor`   |
| The MCP surface from the AI's seat: tool text, results, confusions | `learner-advocate`    |
| Behaviour-preserving cleanup                                       | `code-simplifier`     |
| README, docs, ADRs, JSDoc                                          | `documentator`        |
| Root config, CI, Docker, tooling                                   | orchestrator directly |

## Skills (`.claude/skills/`)

| When                                      | Skill                                               |
| ----------------------------------------- | --------------------------------------------------- |
| Any non-trivial feature                   | `feature-workflow` — one vertical slice, end to end |
| After edits, before review, before commit | `verification-gates`                                |
| Reviewing a diff                          | `pre-merge-review`                                  |
| A new backend module or port              | `hexagonal-module`                                  |
| A new web screen or feature group         | `web-feature`                                       |
| Anything an AI client calls               | `mcp-tool-surface`                                  |
| UI copy, translations, locales            | `i18n`                                              |
| Colours, type, components                 | `brand-ui`                                          |
| Auth, tokens, user input, secrets         | `security-baseline`                                 |
| Scheduling and review logic (FSRS)        | `spaced-repetition`                                 |
| A boundary, dependency or topology choice | `adr`                                               |
| Prove a tool works from an AI's seat      | `dogfood-run`                                       |

The planning pack in `.agents/skills` (vendored, mirrored into
`.claude/skills`: `create-prd`, `create-plan`, `implement-plan`, `grilling`,
…) is user-invoked; `feature-workflow` says when to use which.

## Docs

| Path                         | Holds                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------ |
| `docs/product-spec.md`       | The product specification (source of truth)                                    |
| `docs/architecture.md`       | Services, modules, request paths, auth, data                                   |
| `docs/frontend-structure.md` | Normative web-app structure                                                    |
| `docs/definition-of-done.md` | The one checklist every change meets                                           |
| `docs/roadmap.md`            | Phases, what is done, what is next                                             |
| `docs/adr/`                  | Decisions, never edited after acceptance                                       |
| `docs/review-findings.md`    | Review findings ledger; a finding seen three times becomes a lint rule or hook |
| `brand/README.md`            | Brand: name, palette, type, voice                                              |

## Hooks (`.claude/settings.json`)

Node scripts in `.claude/hooks/`, each exits 0 on its own failure so it never
traps a session: `session-context` (branch, uncommitted work, roadmap status),
`secret-guard` (no secret keys, private keys or service-role keys written into
files; no `dangerouslySetInnerHTML`), `bash-guard` (subagents never touch the
git tree; no force push), `stop-gate` (refuses to end a turn while
`pnpm typecheck` fails, cached on the tree's hash). Settings also deny reading
`.env` and `.env.local` (not the committed `.env.example`) and destructive commands.
