---
name: 'feature-workflow'
description: 'Use for any non-trivial feature, tool, screen or module — anything that creates a file or touches more than one. The procedure for one vertical slice in Deck Club: frame the slice, plan, land the shared surface (contracts, ports, test kits), implement per lane, test, gate, review, demo, commit. Trigger phrases: "implement", "add the X feature", "build the X screen", "new MCP tool", "next slice".'
---

# Feature workflow: one vertical slice

## 0. Frame

Below the non-trivial trigger in `00-core`? Just do it. Otherwise emit the
routing note and write one paragraph:

- **Capability** — who can now do what, in glossary words ("a user's AI client
  can submit a review for a due card").
- **Demo** — the cheapest proof a sceptic accepts: an HTTP test plus the screen
  used in the browser at 1440×900 and 390×844; an MCP contract test plus a
  `dogfood-run` transcript for a tool.
- **Layers** — only those the capability needs: contracts → API module → MCP
  tool → web screen → tests → docs. Parity (spec 1): an MCP capability needs
  its UI twin, now or already.
- **Out of scope** — what the next slice does.
- **Size** — 400–800 changed lines per commit; more means more phases.

Check `git status`: never start on top of another slice's uncommitted files.
A decision on the `00-core` confirmation list? Ask first; write the ADR.

## 1. Plan

For a small slice, the frame is the plan. For a bigger one, use the vendored
pack in `.agents/skills` (user-invoked; when the user asked you to proceed,
read the `SKILL.md` and follow it): `create-prd` for open product questions,
`grilling` to stress a shaky choice, `create-research` / `create-plan` for the
phases, `implement-plan` to run them. Artifacts go in
`.agent-work/tasks/<slug>/` (git-ignored). Or dispatch `architect`.

## 2. Land the shared surface first

In one lane, before anything else: the contracts schemas and error codes
(`contracts-steward`), the port types and in-memory adapters, the test kit
extensions. Rebuild contracts. Name these in every later brief.

## 3. Implement per lane

`backend-dev` (API module, MCP tool), `frontend-dev` (screen, messages in
three locales). No two lanes share a file. Each lane writes its tests with the
code and runs its package's typecheck and tests.

## 4. Gate

`verification-gates` once after integration: typecheck → lint → scoped tests
(blast radius) → deadcode → format:check.

## 5. Review

`pre-merge-review` routes the panel. Blockers and majors are fixed and
recorded in `docs/review-findings.md`.

## 6. Demo

Run the demo named in step 0 and record the evidence (test names, what you did
in the browser, the dogfood transcript).

## 7. Commit

Full `pnpm test` green, then one Conventional Commit per phase. Update
`docs/roadmap.md` when a phase item is done. Meet
`docs/definition-of-done.md`.
