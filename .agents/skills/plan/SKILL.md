---
name: plan
description: Convert an accepted PRD, issue, problem brief, or implementation direction into executable `.plan.md` files for `plan-graph`. Use after `to-prd`, before `plan-graph`, when the user asks for an implementation plan, task breakdown, DAG-ready plan, or agent-ready plan files.
---

# Plan

Create concrete plan files that `plan-graph` can validate and turn into a DAG.

Use this skill after the product or technical direction is stable enough to break into implementation work. If the direction is still fuzzy, use `grill-with-docs` or `validate-direction` first.

## Output Location

Write plans under:

```text
.codex/plans/
```

Use one `.plan.md` file for small work. Use multiple `.plan.md` files when work has independent lanes, a clear dependency chain, or separate ownership boundaries.

## Plan Shape

Each plan file must use the `plan-graph` frontmatter contract:

```markdown
---
name: <short unique plan name>
overview: <one paragraph summary>
todos:
  - id: <stable-id>
    content: <concrete executable task>
    status: pending
isProject: false
---

# <short unique plan name>

## Execution Notes

<intent, context, accepted decisions, and useful references>

## Constraints

<scope limits, compatibility requirements, files not to touch, rollout constraints>

## Operator Guidance

<testing, sequencing, review notes, and when to use subagents>
```

Prefer stable kebab-case todo ids, for example `add-parser-tests`, `implement-parser`, `wire-cli`.

## Workflow

1. Read the PRD, issue, or brief.
2. Read `CONTEXT.md`, `docs/adr/`, and `docs/agents/domain.md` when present.
3. Identify natural work lanes:
   - shared interface or schema work
   - independent implementation modules
   - tests and fixtures
   - migrations or compatibility work
   - documentation or rollout
4. Choose one or more plan files.
5. Make dependencies clear in plan structure:
   - sequential todos inside one plan for tightly coupled work
   - separate plan files for lanes that can run independently
   - note explicit inter-plan dependencies in `Operator Guidance`
6. Keep todo text executable and reviewable. Each todo should describe one outcome, not a vague phase.
7. Validate with `plan-graph` before any subagent launch.

## Boundaries

- Do not spawn subagents from this skill. Planning produces files; orchestration comes later.
- Do not use a single huge plan when two independent lanes would graph cleanly.
- Do not create speculative tasks for work the PRD explicitly excludes.
- Do not mark todos `completed` unless the work is already done in the repo.

## Next Step

Run `plan-graph validate`, then inspect the DAG or frontier. Use `subagent-graph` only after the graph is valid and ownership boundaries are clear.
