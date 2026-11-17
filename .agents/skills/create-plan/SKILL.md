---
name: create-plan
description: Write an implementation-ready plan from approved task artifacts.
disable-model-invocation: true
---

# Create Plan

Turn an approved structure outline and its evidence into the final
implementation contract. This skill writes the plan; it does not implement it.

## Steps

### 1. Establish the evidence set

Read [artifact-inputs.md](references/artifact-inputs.md) before locating or
reading task artifacts. Resolve one task directory, inventory every eligible
artifact in it, and read every eligible artifact to completion. Apply the
precedence rules to every conflict and record any unresolved decision that
prevents an implementation-ready plan.

If the task directory cannot be identified, ask the user for the artifact path
and stop. If a material decision remains unresolved after reading the evidence,
ask the smallest question that resolves it and stop.

**Complete when:** exactly one task directory is known; every eligible artifact
has been fully read; every excluded artifact is accounted for; and every
conflict is either resolved by precedence or surfaced as a blocking question.

### 2. Verify implementation facts in the repository

Inspect the source, configuration, schema, migration, and test files named by
the artifacts. Follow their imports and local conventions far enough to validate
every file path, symbol, integration boundary, code example, test location, and
proposed verification command the plan will rely on. Resolve repository-relative
locations from the repository root.

When an artifact and the current repository disagree, treat the repository as
the authority for current mechanics while preserving the latest approved product
and design intent. State the discrepancy in the plan instead of silently copying
stale details.

**Complete when:** every planned change is anchored to verified repository
evidence, every example matches the current language and local patterns, every
affected testing surface has been checked, and no command in the plan is an
unverified guess.

### 3. Refine the phase contract

Use the approved structure outline as the phase backbone. Expand each phase into
an independently verifiable vertical slice. A phase may depend on completed
earlier phases; it must not require a later phase to build, run, or verify its
promised behavior. Preserve approved ordering and scope unless repository
evidence proves a change is necessary, in which case explain the adjustment in
the plan.

For every phase, identify all implementation units, tests, automated checks, any
genuinely human-only validation, and the human confirmation gate before the next
phase. Include test changes whenever the evidence reveals an established test
pattern for the affected behavior.

**Complete when:** every approved requirement and every structure-outline phase
maps to exactly one or more plan items; each phase has an observable end state
and can be verified before the next begins; and no requirement, dependency, or
test surface is left unmapped.

### 4. Write the indexed plan artifact

Read [plan_template.md](references/plan_template.md) in full and follow its
content contract. List the resolved task directory with `ls -La`, extract every
leading numeric document index, and choose one greater than the highest value.
Render it with at least two digits; use `01` when there is no indexed artifact.
Write the result as:

```text
.agent-work/tasks/<task-slug>/NN-plan-<two-to-four-word-slug>.md
```

Populate repository, branch, and commit metadata from the current checkout.
Replace every instructional placeholder; optional sections are either completed
or removed. When a code example itself contains Markdown fences, use a
four-backtick outer fence.

**Complete when:** the artifact exists at the next chronological path; its
frontmatter and every required section satisfy the template; every phase
contains concrete, ordered changes and checkable verification; and no template
marker or unsupported claim remains.

### 5. Audit the plan as an implementation handoff

Read the artifact from disk after writing it. Check every path, symbol, phase
number, cross-reference, code fence, command, checklist, and phase gate against
the evidence collected in Steps 1–3. Confirm the plan's scope exclusions and
desired end state agree with the approved artifacts.

**Complete when:** every phase and requirement passes the audit, all Markdown
fences are balanced, all artifact-local references resolve, all automated checks
are runnable as written, and every manual check requires human observation
rather than automation.

### 6. Route the handoff

Read [handoff-routing.md](references/handoff-routing.md) and execute exactly one
of its workspace branches. Then read the selected final-answer template and
substitute every placeholder. Return only that rendered template.

**Complete when:** workspace state and effective configuration select one
unambiguous branch; any required task branch is checked out safely; the artifact
location is rendered with a host-provided permalink when available; and the response
contains the selected template with no extra summary or commentary.
