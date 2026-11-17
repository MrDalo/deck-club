---
name: implement-plan
description: Execute an approved implementation plan phase by phase with verification and human gates.
disable-model-invocation: true
---

# Implement Plan

Run an approved plan from `.agent-work/tasks/` as a sequence of independently
verifiable phases. The plan is the implementation authority; the repository is
the reality check. Maintain a **phase ledger** so completed, current, queued,
and blocked work never blur together.

## 1. Resolve the plan and requested range

1. If the user supplied a plan file, use it. If they supplied a task directory,
   inspect it with `ls -La -- <task-directory>` because `.agent-work/tasks/`
   may be a symlink. Select the numbered `*-plan-*.md` artifact; when more than
   one could be current, show the candidates and ask which one governs. Ask for
   a path only when neither a plan nor a resolvable task directory is present.
2. Read the complete plan, its YAML frontmatter, and every repository instruction
   file that applies to the files it names. Extract:
   - repository, branch, and baseline SHA metadata;
   - every phase in order, including dependencies and stated scope;
   - every change item, automated check, and manual check;
   - existing checkbox state and any implementation notes.
3. Resolve the requested range. An explicit phase or phase range wins. Otherwise,
   start with the first incomplete phase and stop after that phase. If every phase
   is complete, proceed to final reconciliation rather than reimplementing it.

This step is complete when exactly one plan and one ordered phase range are
identified, and every plan item in that range has an entry in the phase ledger.

## 2. Establish the repository baseline

From the repository root, record the current branch, HEAD, Git directory, and
working-tree status. Compare them with the plan frontmatter and inspect the diff
before writing anything.

Read `.agent-work/workspace.json` and `.agent-work/workspace.local.json` when
present, with the local file taking precedence. Use their disabled state,
branch template, source reference, and worktree path only to interpret the
checkout the workflow already prepared; implementation does not perform setup.

- Treat the plan's branch and SHA as planning provenance, not as an instruction
  to switch. Work in the current checkout or worktree when it belongs to the
  planned repository and the plan SHA is reachable from its history. A task
  branch may legitimately differ because worktree or disabled-workspace setup
  happened after the plan was written.
- Stay in an already-correct worktree. This skill creates neither a worktree nor
  an implicit branch switch. An unrelated branch, an unreachable baseline, or a
  repository mismatch is a gate: report it and get direction before editing.
- When the current checkout is the repository's default branch and the user has
  not explicitly chosen to implement there, confirm the intended task branch or
  worktree before writing.
- Treat existing modifications and untracked files as user-owned. Record which
  paths predate this run and keep phase edits separable from them.
- Read the ticket and accepted upstream artifacts when the plan points to them.
  Resolve conflicts by recency: plan > structure outline > TDD > design
  discussion > research > ticket.

For a resumed plan, classify each phase as completed, partial, queued, or
blocked. Trust checked work unless the repository, tests, or commit history
provides concrete contradictory evidence. Manual checkboxes count only when the
human confirmed them.

This step is complete when the correct repository and branch are confirmed,
pre-existing changes are accounted for, and every selected phase has a current
ledger state.

## 3. Execute one phase

Default to a fresh `implementer-agent` subagent for each phase. When the host
prefixes agent names, select the qualified variant whose local name is
`implementer-agent`. Send a compact contract containing only:

```text
Implement Phase <N> from <plan-path>.
Resume at <first incomplete item, when applicable>.
Stay within this phase, run its automated verification, update only completed
automated checkboxes in the plan, and stop with changed files, checks, manual
checks, and deviations.
```

The agent reads the plan and relevant code itself; duplicating plan content in
the prompt creates a second source of truth. Use a new agent for the next phase
so phase boundaries remain real.

When `implementer-agent` is unavailable, or the user explicitly requests direct
execution, implement the phase inline under the same contract and say which
mode is active. In either mode:

- implement the phase's intent, not merely its example snippets;
- keep changes inside the selected phase and preserve unrelated work;
- update an automated checkbox only after its named condition passes;
- leave manual checkboxes open until the human confirms them;
- stop at the phase boundary.

If the plan and repository diverge, or execution becomes blocked, read
[`references/deviations-and-recovery.md`](references/deviations-and-recovery.md)
and follow the matching recovery branch before continuing.

This step is complete when every change item in the current phase is either
implemented or explicitly blocked, all touched paths are reported, and no item
has disappeared from the phase ledger.

## 4. Prove the phase

Review the implementation independently of the implementer report. Before
declaring the phase ready, read and apply
[`references/verification-and-checkpoints.md`](references/verification-and-checkpoints.md).

Run every automated criterion in the phase plus any focused checks required by
the actual blast radius. Fix in-scope failures and rerun the affected checks.
Distinguish failures introduced by the phase from reproducible baseline
failures. Inspect the complete phase diff for omissions, accidental scope, debug
residue, generated artifacts, and unsafe staging candidates.

This step is complete only when every change item and automated criterion maps
to recorded evidence, every failure has a disposition, and the phase diff is
within scope.

## 5. Cross the human gate

Read [`references/phase-handoffs.md`](references/phase-handoffs.md) and use the
matching phase-ready or blocked structure. Report what changed, the exact
automated results, deviations, and every still-open manual check. Then pause for
the human to review the phase, perform manual checks, report problems, and
authorize continuation.

- If the phase has no manual checks, human review is still the phase boundary.
- If the user authorized a consecutive range, use a fresh implementer and repeat
  automated verification at every phase boundary. Defer the human pause to the
  end of the range only when no intermediate manual result is a prerequisite for
  later work.
- If feedback requires corrections, keep the same phase current, implement and
  re-prove the correction, then present the gate again.

This step is complete when every required manual check has explicit human
confirmation, its checkbox is updated to match that confirmation, and the human
has approved the phase or selected range.

## 6. Create the phase checkpoint

After approval, create the phase commit unless the user has requested an
uncommitted workflow. Apply the staging and commit rules in
[`references/verification-and-checkpoints.md`](references/verification-and-checkpoints.md).
The `.agent-work/tasks/` tree is an external task artifact and stays outside the
repository commit even when the plan was edited through its symlink.

Update the ledger with the commit hash, then continue only through the phase
range the user authorized. Otherwise, stop with the next queued phase named.

This step is complete when the approved phase has either one verified scoped
commit or an explicit user-approved uncommitted disposition, and the working
tree still preserves all unrelated changes.

## 7. Reconcile the completed plan

After the last phase, compare the entire plan with the final implementation and
account for every planned item, automated check, manual check, deviation, and
checkpoint. Run the plan's final or integration checks, then inspect the full
implementation diff or commit range against the recorded baseline.

If reconciliation requires a code change, reopen the phase that owns it and
repeat execution, proof, human gate, and checkpointing. Reconciliation itself
does not smuggle fixes past a phase boundary.

Full completion requires all of the following:

- every phase is complete in the ledger;
- every automated criterion passes or has an explicitly accepted disposition;
- every required manual criterion has human confirmation;
- every material deviation is disclosed;
- the implementation diff contains no unexplained out-of-scope change;
- checkpoint commits or the approved uncommitted state are recorded.

Only after all six conditions hold, read
[`references/implement_plan_final_answer.md`](references/implement_plan_final_answer.md)
and use its final handoff structure exactly. A selected range that ends before
the plan does receives a phase-gate report, not the final-completion handoff.
