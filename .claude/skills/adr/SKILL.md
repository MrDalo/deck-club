---
name: 'adr'
description: 'Use when a decision changes a module or service boundary, adds or removes a port, changes where state lives, the deployment topology or auth, adds a runtime dependency to packages/contracts, or reverses an existing ADR. How to write, number and file an Architecture Decision Record.'
---

# Architecture Decision Records

Ask the user before deciding (rule `00-core`), then record it.

- File: `docs/adr/NNNN-kebab-title.md`, next free number, listed in
  `docs/adr/README.md`.
- Status: `Proposed` → `Accepted` (by the user) → later `Superseded by NNNN`.
  An accepted ADR is never edited except its status line; a change of mind is
  a new ADR.

```markdown
# NNNN. Title in sentence case

- Status: Proposed | Accepted | Superseded by NNNN
- Date: YYYY-MM-DD

## Context

What forces the decision; cite spec sections.

## Decision

What we do, in one paragraph.

## Consequences

What gets easier, what gets harder, what we must watch.

## Alternatives considered

Each with the reason it lost.
```
