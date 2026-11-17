---
name: iterate-structure-outline
description: Revise an existing structure outline from feedback, review comments, or new implementation evidence.
disable-model-invocation: true
---

# Iterate a structure outline

Revise the existing outline in place. Feedback changes the artifact, never starts implementation.

## 1. Establish the request

If the invocation contains neither feedback nor an instruction to inspect artifact comments, ask:

```text
I'm ready to iterate on the structure outline. What would you like to change? You can share feedback, point me to artifact comments, answer an open question, or ask me to rework the phase structure or verification.
```

Stop after asking. A bare invocation is not permission to invent revisions.

Resolve the task directory and outline path from the prompt or conversation. When only a directory is supplied, or the known artifact path is under `.agent-work/tasks/<task-slug>`, inspect that directory with `ls -La`; the path may be a symlink. Use that listing as the directory inventory rather than globbing or searching through `.agent-work/tasks`. If the task directory cannot be identified from available context, ask for the artifact path.

Read the outline and every prior workflow artifact in the task directory in full: `ticket.md` or `task.md`, completed research, design discussion, PRD, TDD, and any later planning artifact. Read every file or path cited by those artifacts or by the feedback when it can affect the revision. Research-question documents are superseded by completed research and are needed only when feedback explicitly concerns them.

Apply this precedence when sources conflict:

```text
current user decision and verified evidence
  > structure outline
  > TDD
  > PRD
  > design discussion
  > completed research
  > ticket or task
```

This step is complete when the exact outline path is known and every source capable of changing the requested revision has been read.

## 2. Inventory the feedback

Build a private checklist containing every discrete request, answer, correction, and comment. Keep comment state separate from document state: a comment can be incorporated in the outline while remaining open in the artifact system.

When feedback arrives as an artifact-comment block, a ticket file containing comments, or an instruction to fetch, reply to, or resolve comments, read [feedback and comment handling](references/feedback-and-comments.md) before acting. Follow every comment thread, including replies and existing resolution markers.

Classify each checklist item as one of:

- `verify` — asserts something about the repository, dependency, or existing behavior;
- `decision` — records the user's chosen product or technical direction;
- `revision` — requests a direct structural or editorial change;
- `question` — remains open until the user or evidence supplies an answer;
- `comment-action` — requests a reply, resolution, reopening, or deletion in the artifact system.

This step is complete when every input has exactly one checklist entry, source, and required outcome.

## 3. Verify the change surface

Treat user decisions as authoritative choices and factual claims as hypotheses. Inspect the cited code and current repository patterns before changing paths, ownership, dependencies, signatures, or verification commands. Re-check prior research where repository state may have moved since it was written.

For deeper investigation, delegate bounded questions to the available specialists and wait for their results before editing:

- `codebase-locator` for ownership and file discovery;
- `codebase-analyzer` for implementation and dependency behavior;
- `codebase-pattern-finder` for analogous production and test patterns;
- `web-search-researcher` for external standards or practices;
- a library researcher, when one is available, for dependency-specific questions.

Run independent investigations concurrently when possible. Use repository evidence for repository claims and primary sources for external claims. Record a disposition for every checklist item: `incorporate`, `already represented`, `decline with evidence`, `defer with owner`, or `needs user decision`.

This step is complete when every factual item has evidence and every checklist item has a defensible disposition.

## 4. Recompute the outline

For any change that affects scope, phase boundaries, ordering, files, dependencies, tests, or validation, read [outline revision rules](references/outline-revision-rules.md) and apply its complete audit. A local wording correction may stay local only when it cannot change those concerns.

Edit the existing outline at the same path. Preserve its frontmatter, filename, overall artifact format, and stable phase identity where the intended outcome remains unchanged. Repaint affected sections so the result reads as one current outline rather than a feedback log.

At minimum:

- incorporate accepted scope changes into both the desired end state and **What we're not doing**;
- incorporate answered questions into the relevant sections and remove them from **Open Questions**;
- add newly exposed blocking questions to **Open Questions**;
- update the implementation checklist, phase headings, change outlines, dependencies, and verification together;
- preserve a completed phase only when its outcome and proof remain valid after the revision; reopen it when the new outline requires more work.

Keep the outline at header-file resolution: precise ownership, interfaces, data shapes, dependencies, and proof, with focused snippets only when they clarify structure. Use four-backtick outer fences when an example contains fenced Markdown.

This step is complete when every `incorporate` item appears in the artifact, every `already represented` item is still true, and no superseded answer remains as live guidance.

## 5. Audit readiness and comment actions

Re-read the rendered outline and check all of the following:

- every requested item has its recorded disposition;
- every desired-end-state requirement belongs to at least one phase;
- every in-scope phase contribution traces back to a requirement or verified constraint;
- phase order is acyclic and each prerequisite exists before its consumer;
- every phase can be verified at its own boundary without work from a later phase;
- each changed file, interface, migration, and test responsibility appears in the correct phase;
- automated checks use real repository commands and manual checks cover only irreducible human judgment;
- the implementation overview and phase sections have the same count, titles, order, and completion state;
- open questions, unresolved feedback, and unresolved artifact comments are explicit.

Execute authorized comment replies or state changes only after their corresponding artifact edits and evidence checks succeed. Re-fetch comments afterward when the comment tool supports it, and confirm the requested final state by comment ID.

Set the outline state:

- **pending** — any blocking open question, feedback item awaiting a decision, requested comment action that failed, or comment content awaiting a disposition remains;
- **ready** — every input is accounted for, the audit passes, and no blocking question or unresolved comment content remains. An incorporated comment left open because resolution was not authorized does not by itself block content readiness; report that state accurately.

This step is complete when the state is unambiguous and every failed check has either been repaired or is named as pending.

## 6. Select the handoff

Capture any artifact permalink returned while reading or editing the outline.
Set `ARTIFACT_TARGET` to that permalink when available, otherwise to the local
outline path. Then choose exactly one template:

1. For **pending**, read [the pending-review handoff](references/structure_outline_final_answer_pending.md).
2. For **ready**, read `.agent-work/workspace.json` and `.agent-work/workspace.local.json` when present; the local file overrides shared values. Run `git rev-parse --git-dir`.
3. If the Git directory contains `.git/worktrees/`, read [the in-worktree handoff](references/structure_outline_final_answer_in_worktree.md).
4. Otherwise, if the effective workspace configuration sets `disabled: true`, render the configured branch template or default to the task slug. Check `git status --short`, `git branch --show-current`, and whether that branch already exists; switch to the existing branch or create it from the current HEAD only when the checkout preserves the working tree. A checkout conflict makes the result **pending**. After a successful checkout, read [the workspace-disabled handoff](references/structure_outline_final_answer_disabled.md).
5. Otherwise, read [the worktree-setup handoff](references/structure_outline_final_answer.md).

Replace every template placeholder, including `ARTIFACT_TARGET`, and respond
with the selected template only. The handoff is complete when it reflects the
actual readiness, workspace mode, branch, and a usable artifact location.
