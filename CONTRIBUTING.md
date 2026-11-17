# Contributing to Deck Club

Thanks for helping. Deck Club aims to be a reference-quality open-source
project, so the bar is: small vertical slices, tests for every feature, and
documentation that stays true.

## Before you start

- Read [docs/product-spec.md](docs/product-spec.md) for the section you are
  touching and [docs/architecture.md](docs/architecture.md).
- Check [docs/roadmap.md](docs/roadmap.md) and open an issue for anything
  bigger than a fix, so we agree on the slice first.

## How a change looks

1. One capability, through every layer it needs: contracts → API module →
   MCP tool → web screen → tests → docs. Anything the AI can do over MCP, a
   person can do in the UI.
2. Schemas only in `packages/contracts`. Business rules only in the API's
   module `domain/`.
3. Every feature has unit tests (see the table in
   `.claude/rules/40-tests.md`): a use case gets a happy path and two
   rejection tests.
4. Every UI string in `apps/web/messages/en.json`, `sk.json` and `cs.json`.
5. The checklist in [docs/definition-of-done.md](docs/definition-of-done.md).

## Gates (CI runs the same)

```bash
pnpm format:check && pnpm typecheck && pnpm lint && pnpm deadcode && pnpm test
```

## Commits

Conventional Commits: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`,
with an optional scope (`feat(api): …`). One slice phase per commit, roughly
400–800 changed lines.

## Decisions

A change to a module boundary, where data lives, the topology or auth needs an
ADR in `docs/adr/` (template in `.claude/skills/adr/SKILL.md`).
