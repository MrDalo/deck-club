# Plan artifact contract

Use this skeleton as a content contract, not as text to leave in the finished
artifact. Replace every bracketed field. Remove an optional section when it has
no applicable content.

````markdown
---
task: <task-directory-name>
type: plan
repo: <repository name or repository-root path>
branch: <git branch at plan creation>
sha: <full git rev-parse HEAD value>
---

# <Feature or task name> Implementation Plan

## Overview

<What will be built, why it matters, and the boundary of this plan.>

## Current State Analysis

<The existing implementation, missing behavior, and constraints that shape the
work.>

### Key Discoveries

- `<path>:<line-or-symbol>` — <fact that changes the implementation approach>
- `<path>:<line-or-symbol>` — <local pattern the implementation should follow>
- `<path>:<line-or-symbol>` — <constraint, dependency, or integration boundary>

## Desired End State

<Observable behavior and system state after every phase is complete, including
how the final state can be verified.>

## Out of Scope

- <Explicit exclusion that prevents adjacent work from entering this plan>

## Implementation Approach

<The chosen strategy, phase ordering, and the important tradeoffs behind it.>

---

## Phase 1: <Outcome-oriented title>

### Phase Outcome

<The independently verifiable behavior or capability delivered by this phase.>

### Changes Required

#### 1.1 <Implementation unit>

- **File:** `<repository-relative/path>`
- **Anchor:**
  `<symbol, section, migration, route, or new-file destination>`
- **Change:** <Precise behavior and responsibility to add, modify, or remove.>

```diff
 <small amount of existing context>
-<old shape when relevant>
+<target shape with concrete names, signatures, and control flow>
```

<Repeat numbered implementation units until every file and integration needed
by the phase is covered. Include new or changed tests beside the behavior they prove.>

### Success Criteria

#### Automated Verification

- [ ] `<exact command>` — <observable passing result>
- [ ] `<exact focused test command>` — <behavior or regression it proves>

#### Manual Verification

- [ ] <Action, environment, and expected observation that require human
      judgment>

<Remove Manual Verification when every claim can be checked automatically.>

### Phase Gate

Stop after this phase's changes and automated checks. Complete any listed manual
verification, report the results, and obtain human confirmation before Phase 2.

---

## Phase 2: <Outcome-oriented title>

<Repeat the complete phase contract. The final phase gate confirms completion instead
of naming another phase.>
````

## Content rules

- Keep the approved phase boundaries and ordering unless verified repository
  evidence requires an explicit correction.
- Name exact repository-relative files and stable symbols or sections. Use line
  numbers only as supplemental orientation because they drift.
- Show implementation-ready code shapes for meaningful changes. Prefer focused
  diffs, signatures, schemas, request/response contracts, and control flow over
  whole-file dumps or vague prose.
- Include every affected test file or a precise new test destination when the
  repository has a relevant testing pattern.
- Automated criteria are executable commands copied from or validated against
  the repository. State the expected successful result.
- Manual criteria describe an action and an observable result. Omit that
  subsection when automation covers the phase.
- Every phase ends with a gate. The implementer pauses for human confirmation
  before proceeding, including when the phase has automated verification only.
- The overview, desired state, and exclusions bound the same scope. Every
  in-scope requirement appears in a phase; every phase item serves an in-scope
  requirement.

**Contract complete when:** every required section is populated, every in-scope
requirement maps to a numbered change and a success criterion, every phase can
be verified without future phases, and no bracketed instruction remains.
