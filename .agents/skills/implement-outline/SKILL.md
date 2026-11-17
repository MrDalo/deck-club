---
name: implement-outline
description: Implement a structure outline phase by phase with delegated execution and verification gates.
disable-model-invocation: true
---

# Implement a Structure Outline

Orchestrate implementation directly from a structure outline in
`.agent-work/tasks/`. The outline supplies intent and signatures; the
`outline-implementer-agent` writes the code. Keep every phase behind a
verification gate.

## Modes

- **One phase** is the default. Stop at the human gate before committing or
  starting another phase.
- **Consecutive phases** apply only when the user names a range or explicitly
  asks to continue through multiple phases. Use a fresh implementer agent and
  an automated gate for every phase, then hold one human gate for the requested
  range.
- **Resume** starts at the first phase without a `✅` marker, using validation
  checkboxes to recover finer-grained progress. Treat completed work as valid
  unless the code, diff, or reported failure gives concrete reason to inspect it.

This skill is the orchestrator. Use the agent whose base name is
`outline-implementer-agent` (the host may add a plugin namespace); the generic
plan implementer is a different role. If that agent is unavailable, execute the
same single-phase contract inline: reread the outline and companion documents,
limit edits to that phase, run its automated checks, and return the same
accounting. Start each later phase from a fresh reread rather than carrying
unstated conclusions forward.

## Steps

### 1. Establish the run

Require a task directory or structure-outline path. Resolve its task directory,
then run `ls -La .agent-work/tasks/<task-slug>` because that path may be a
symlink. An exact outline path selects that file; otherwise identify the single
`*-structure-outline.md` file. Locate every available ticket or task, research,
design-discussion, PRD, and TDD document. Ask the user to resolve a missing or
ambiguous outline.

Read the repository instructions, outline, and all discovered companion
documents in full. Repository instructions constrain work in the checkout;
resolve conflicts among task artifacts in this order:

1. structure outline
2. TDD
3. PRD
4. design discussion
5. research
6. ticket or task

Inspect the current branch/worktree and working-tree changes. Implementation
runs in the current checkout: preserve pre-existing changes, create or switch no
worktree, and exclude `.agent-work/tasks/` from commits because it points to the
artifact repository. Select the phase or explicit phase range according to the
mode above, confirm that each dependency is either already complete or is an
earlier phase inside the selected ordered range, and identify the code
paths and symbols each selected phase expects to affect.

**Complete when:** exactly one outline, every applicable repository instruction,
every available companion document, the current git state, the execution mode,
and every selected phase are known; every selected phase has dependencies that
are already satisfied or will be satisfied earlier in the same ordered run, and
an accounted-for implementation surface.

### 2. Delegate one phase

Before each selected phase, verify that its dependencies now pass: a dependency
inside the requested range counts only after that earlier phase passed its
automated gate. Then launch a fresh `outline-implementer-agent` for the phase, or
use the inline fallback described above. For delegation, keep the prompt compact:
provide the exact outline path, all companion-document paths, the phase number,
the precedence rule, and this contract:

```text
Implement only Phase <N> from <outline-path>.
Read these companion documents for context: <paths>.
The structure outline wins conflicts. Use its intent and signatures to write
the implementation, adapting only where the repository requires it.
Run every automated validation item for this phase. Mark a validation checkbox
[x] only when that check passes. Leave manual items and the phase-title ✅ for
human confirmation. Return changed files, automated results, manual checks, and
any mismatch. Stop after this phase.
```

Let the agent read the documents; repeating their contents in the prompt wastes
context and risks creating a second source of truth.

**Complete when:** the phase's dependencies pass and one fresh agent or inline
execution pass has attempted exactly that phase and returned an exhaustive
accounting of changed files, automated validation, remaining manual validation,
and mismatches.

### 3. Enforce the automated gate

Review the agent's report and the actual diff. Account for every new or modified
path, including generated files, and preserve every pre-existing change. Confirm
that the implementation matches the phase's intent in the wider codebase, then
run any phase validation command the agent omitted. After the last selected
phase, run the repository's relevant broader integration checks. Record exact
commands and outcomes.

Set `- [x]` only for automated checks that passed. A failing or unrun check stays
unchecked. Route implementation defects back through an
`outline-implementer-agent` for the same phase, then repeat this gate.

Use these failure branches:

- **Outline mismatch:** report `Expected`, `Found`, and `Why this matters`, then
  ask the user to choose the direction. If the outline itself is stale, hand off
  by recommending an explicit `iterate-structure-outline` invocation.
- **Environmental or unavailable check:** report the command, failure, and
  unverified consequence; ask whether the user wants to resolve it or accept the
  documented gap. Acceptance records a gap and does not turn the checkbox into a
  pass.
- **Unexpected or overlapping change:** identify the affected paths and pause
  for ownership guidance before modifying or staging them.

**Complete when:** every selected phase change is explained, every runnable
automated validation item passes and is marked accurately, every unverified item
has an explicit consequence, and the exact manual-validation list is ready.

### 4. Cross the human gate

For one-phase mode, report immediately. For consecutive-phase mode, repeat Steps
2–3 for each selected phase, retaining each phase's manual checklist, then report
the whole requested range. Use this structure:

```markdown
## Phase <N> implementation summary

**Implemented**
- <observable changes>

**Automated verification**
- `<command>` — <result>

**Manual verification required**
- <unchecked manual validation from the outline>

Ready for your manual-verification result and approval to commit. In one-phase
mode, also ask for permission to continue to Phase <N+1>.
```

When several phases were requested, include one section per phase. If the user
reports a problem, delegate the correction to the outline implementer for the
affected phase and repeat the automated and human gates. After the user confirms
all manual items for a phase, mark those items complete and add `✅` to that phase
title. The marker means both automated and manual validation passed.

**Complete when:** the user has confirmed every manual item in the selected
phase or range, approved the resulting changes, and—when more phases remain
outside the selected range—explicitly permitted the next phase.

### 5. Commit approved work

Reinspect the diff, stage only implementation files owned by the approved phase
or range, and keep `.agent-work/tasks/` plus unrelated changes out of the commit.
Create the commit only after the human gate. If commit creation fails, report the
exact failure and retain the verified working tree for recovery.

**Complete when:** the approved implementation is committed, or a commit failure
has been reported without losing or mis-staging work.

### 6. Continue or finish

Return to Step 2 only for a phase the user already selected or explicitly
approved. A partial run ends with the completed phase markers, commit, remaining
phase, and next required gate clearly stated.

After the last outline phase, confirm that every phase title has `✅`, every
validation item is complete, all approved implementation is committed, and the
working tree contains no unexplained changes. Then read
[`references/implement_outline_final_answer.md`](references/implement_outline_final_answer.md)
and render that handoff exactly, substituting real values and adding no separate
summary.

**Complete when:** either the partial-run handoff identifies the next incomplete
phase and gate, or the final-response reference has been rendered after every
outline phase passed both verification gates and all approved work was committed.
