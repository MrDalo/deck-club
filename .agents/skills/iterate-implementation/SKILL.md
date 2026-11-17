---
name: iterate-implementation
description: Diagnose, repair, and verify follow-up changes to an implementation already in progress.
disable-model-invocation: true
---

# Iterate an implementation

Treat follow-up feedback as a reconciliation job: recover the accepted intent, prove the current behavior, and close every reported or discovered gap without restarting sound work.

## 1. Establish the workspace and authority

Resolve the repository root, branch, worktree identity, and current status before changing files. Use `git rev-parse --show-toplevel` and `git rev-parse --git-dir`; when `.agent-work/workspace.json` or `.agent-work/workspace.local.json` exists, inspect both and let the local file override the shared file. Stay in the current checkout. A linked worktree, an ordinary checkout with workspace creation disabled, and an ordinary checkout with workspace creation enabled are all valid iteration locations; iteration itself does not create or switch branches or worktrees. If the requested work belongs to a different checkout, stop with the exact mismatch and the target path or branch that must be selected.

Locate the task directory from a supplied path or ticket ID. Under `.agent-work/tasks/`, inspect directory entries with symlink-aware commands such as `ls -La`; task directories may be symlinks. Read the complete plan and every artifact needed to interpret it: ticket or task, research, design discussion, PRD/TDD, structure outline, review comments, and relevant logs. If no plan exists, derive authority from the remaining artifacts. When artifacts conflict, use this precedence:

`plan > structure outline > TDD > PRD > design discussion > research > ticket`

Repository instructions and the user's current explicit direction still govern the work. Record any conflict rather than silently blending incompatible requirements.

Identify the implementation boundary from an explicit commit, phase handoff, or trustworthy merge base. Inspect every staged, unstaged, untracked, and committed change since that boundary. Separate iteration-owned changes from unrelated user work.

This step is complete when the task sources, authority order, implementation boundary, current phase, worktree mode, and unrelated changes are all known or each missing item is named as an uncertainty.

## 2. Build the feedback ledger

Inventory every input from the current request, issue or review comments, referenced files and examples, failing checks, logs, prior agent handoffs, incomplete artifact items, and visible implementation deviations. Give each item an ID and record:

- the reported observation or requested outcome;
- its source and concrete evidence;
- expected behavior and affected scope;
- current disposition: `pending`, `needs-input`, `rejected-with-evidence`, `deferred-by-user`, `repairing`, `awaiting-verification`, or `complete`.

Verify user-supplied paths, snippets, and causal claims against the repository or runtime evidence. Preserve the requested outcome while correcting inaccurate details in the repair plan.

This step is complete when every distinct input maps to exactly one ledger item and every item has evidence, a disposition, and a next action.

## 3. Diagnose each open item

For a defect, reproduce the failure with the narrowest reliable check, then trace it to a root cause. Inspect relevant logs, data stores, and running services when the behavior depends on runtime state. For a requested change, compare the actual behavior with the authoritative artifact and surrounding implementation. Inspect the specific locations named by the user plus the callers, data paths, tests, configuration, and generated surfaces needed to bound impact.

Classify implementation differences as one of:

- planned and present;
- intentional deviation with a recorded reason;
- accidental deviation requiring repair;
- necessary addition absent from the artifact;
- planned work still missing.

When local evidence cannot establish the cause, request the smallest missing input. If runtime evidence is required, add only scoped instrumentation that the repository can safely carry, provide exact reproduction steps, and pause until results arrive. When two materially different solutions remain viable, present the verified tradeoff and ask the user to choose. Otherwise select the smallest coherent repair that satisfies accepted intent.

This step is complete when every open ledger item has a confirmed cause and repair target, a documented evidence-backed rejection, an approved deferral, or one precise blocking question.

## 4. Route implementation work

Keep surgical repairs in the current iteration. Treat an entirely unstarted phase or a coherent follow-on feature as implementation work and delegate it through the host's agent mechanism when available:

- use `implementer-agent` when a detailed plan is authoritative;
- use `outline-implementer-agent` when the structure outline is authoritative and no plan exists.

Give the agent the phase, artifact paths, feedback IDs, ownership boundary, and required automated checks. Ask it to stop after that bounded work and report changes, verification, deviations, and manual checks. Keep the prompt concise because the agent reads the artifacts itself. If helper agents are unavailable, execute the same bounded assignment locally.

Review the agent's result and actual diff before accepting any claim. The orchestrator retains ownership of the ledger, integration, artifact state, and final verification.

This step is complete when every open item has one owner and each delegated assignment has a non-overlapping boundary and an explicit verification target.

## 5. Run the repair loop

Work one causally related item cluster at a time:

1. Capture a failing test, reproduction, or other observable mismatch.
2. Apply the smallest complete change that fixes the root cause and its necessary integration points.
3. Run the focused check that proves the item changed from failing to passing.
4. Inspect the resulting diff for collateral behavior and update the ledger.

If the focused check still fails, revise the diagnosis before adding another change. Preserve unrelated edits and follow repository conventions. When a Markdown file demonstrates fenced Markdown, make the outer fence longer than every nested fence. Keep temporary logging, fixtures, generated files, and compatibility shims only when they are intentional deliverables.

Repeat until every repairable item is `awaiting-verification` or `complete`. This step is complete only when no ledger item remains `pending` or `repairing`.

## 6. Verify the integrated result

Run verification in widening rings:

1. focused regression checks for every repaired item;
2. affected module or integration tests;
3. repository-prescribed formatting, lint, type, build, and test commands relevant to the changed surface;
4. manual checks required by the plan or by behavior that automation cannot observe.

Record the exact command or manual action and result against each ledger item. Distinguish a new regression from a reproducible pre-existing failure. A failed or unavailable check stays visible with its output, impact, and next action. Manual items become complete only after the user confirms them.

Re-read the authoritative artifacts and audit the entire implementation diff, not only the latest edits. Confirm that every planned item is present or explicitly disposed, every addition and deviation is explained, no repair contradicts a later artifact, and the remaining diff is intentional. Update implementation checkboxes only for work actually completed; update manual-verification checkboxes only from human confirmation. When an artifact integration supplies an optional permalink, preserve it for the handoff.

This step is complete when every ledger item has verification evidence, all required automated checks pass or have a documented unresolved disposition, every deviation is accounted for, and no temporary or unrelated change is attributed to the iteration.

## 7. Hand off the iteration

Read the [iteration handoff contract](references/iterate_implementation_final_answer.md) whenever work completes, pauses for manual verification, or blocks on missing evidence or a decision. Select its status from the gates in that file and render the matching response with no additional sections.

Iteration is complete only when every feedback item is `complete`, `rejected-with-evidence`, or `deferred-by-user`; all required automated checks pass; required manual verification is confirmed; artifact state matches the implementation; and the remaining diff is intentional. A commit or push is a separate action and occurs only when the user authorizes it.
