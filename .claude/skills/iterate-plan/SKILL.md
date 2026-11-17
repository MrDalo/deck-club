---
name: iterate-plan
description: Revalidate and revise an existing implementation plan from feedback.
disable-model-invocation: true
---

# Iterate Plan

Revise one existing implementation plan in place. The output remains a plan: inspect the repository and edit the artifact, but leave implementation work to the implementation phase.

## Steps

### 1. Establish the revision set

Resolve exactly one target plan and all of its context:

1. Use the plan path supplied by the user or already established in the conversation. If it is absent, inspect the active `.agent-work/tasks/<task>/` directory. Use a symlink-aware listing such as `ls -La`; task directories may be symlinks.
2. Read the entire plan, every user-supplied file, and every artifact in that task directory. Include `ticket.md` or `task.md`, research, design discussion, PRD or TDD, and structure outline files when present.
3. Inventory each requested change from the user's message and any supplied feedback file. Record its source, the affected plan section, and whether it states desired behavior, alleges a repository fact, or asks for a decision.
4. If the input contains an inline `<comments>` block, names artifact comments, relies on a ticket/comment file, or identifies only the plan without giving feedback, read [feedback and decisions](references/feedback-and-decisions.md) before classifying or acting on those items.

If no target can be distinguished among multiple plan files, ask the user to identify it and stop. If there is a target but no revision instruction or feedback, ask what they want changed and stop.

This step is complete only when one plan is selected, every available task artifact has been read, and every feedback item has a source, affected section, classification, and requested outcome or explicit unknown.

### 2. Revalidate the plan against the repository

Treat the repository as the source of truth for current implementation facts. Inspect the current branch and `HEAD`, then verify:

- every path and symbol named by the feedback;
- every path, symbol, dependency, configuration key, and test target the proposed revision will retain or introduce;
- each code example against current APIs, types, naming, and nearby implementation patterns;
- each automated verification command against current scripts, tooling, and test layout;
- phase ordering against real dependencies between the planned changes.

User feedback controls desired behavior; repository evidence controls claims about what exists now. When they conflict, preserve the desired outcome and repair the implementation route. Prefer stable symbol or section anchors over stale line numbers.

This step is complete only when every retained or proposed implementation pointer has current evidence, and every contradictory or unverifiable claim is listed for disposition rather than silently copied into the plan.

### 3. Reconcile feedback and decisions

Build a revision ledger with one disposition for every feedback item: `apply as stated`, `already satisfied`, `apply with evidence-backed correction`, or `decision required`.

Use this authority order:

1. the user's latest explicit direction for desired behavior and scope;
2. the existing plan;
3. structure outline;
4. TDD, then design discussion;
5. research;
6. ticket or task description.

Repository evidence may correct factual statements at any level. It does not choose among materially different product, scope, or architecture outcomes on the user's behalf.

When a real decision remains, ask one question that presents the viable options, concrete tradeoffs, and a recommendation, then stop. Resume from the ledger after the answer. Straightforward corrections and evidence-backed repairs proceed without a confirmation round.

This step is complete only when every feedback item has a defensible disposition and no unanswered decision can change the plan's scope, architecture, or dependency order.

### 4. Revise the plan in place

Edit the existing plan at the same path. Preserve its frontmatter and established section shape unless the feedback explicitly changes the plan format. Keep these invariants:

- Each phase is independently implementable and testable, ordered after its prerequisites.
- Each change names the exact file and current symbol or insertion point, explains the intended behavior, and includes accurate code or diff examples where they remove implementation ambiguity.
- Automated success criteria are runnable commands with an observable passing result.
- Manual criteria appear only when human observation or judgment is material; they state the action and expected result. A phase with manual criteria pauses for confirmation before the next phase.
- Tests follow repository patterns discovered during revalidation and cover the behavior changed by that phase.
- Overview, current state, desired state, approach, exclusions, phases, and success criteria agree with one another.
- Every feedback item marked `apply as stated` or `apply with evidence-backed correction` changes all affected sections, not only the sentence that attracted the comment.

When the plan records completed work, preserve the recorded outcome. If new evidence makes completed work obsolete or unsafe, annotate the conflict and add a later remediation or rollback step instead of rewriting history.

Update an existing revision-history section when present. Otherwise add a compact revision note only when it is needed to explain a changed decision or invalidated completed work. Use four-backtick outer fences when a Markdown example contains triple-backtick fences.

After the content edit, perform only the comment replies or state changes that
the user explicitly authorized. Process them one thread at a time, then re-read
each affected thread to confirm its requested state. Applying comment content
does not imply authority to reply, resolve, reopen, delete, or restore.

This step is complete only when every applied disposition is reflected everywhere it propagates, every remaining step is executable from current repository state, dependency order is valid, and every phase has an observable completion signal.

### 5. Audit the finished artifact

Read the revised plan from beginning to end and compare it with the revision ledger and repository evidence. Check that:

- every feedback item has the recorded disposition and no requested change was dropped;
- frontmatter still identifies the task, repository, current branch, and revalidated `HEAD` accurately;
- retained paths, symbols, examples, tests, and commands are current;
- the phase sequence contains no circular, missing, or reversed dependency;
- code fences and local links are valid;
- placeholders remain only where the implementer must supply a runtime value;
- the revision introduced no contradiction between narrative, examples, and success criteria.
- every authorized comment action reached its requested observable state and
  every unrequested comment state remained unchanged.

If the ledger contains `already satisfied` or `apply with evidence-backed correction`, the final plan itself must make the relevant truth clear; do not add process commentary merely to prove that feedback was reviewed.

This step is complete only after the reread accounts for every ledger item and every check above passes or the workflow has stopped on one precise user decision.

### 6. Route the handoff

After the content audit and comment-operation reconciliation:

1. Read `.agent-work/workspace.json` and `.agent-work/workspace.local.json` when present. For `disabled`, values explicitly set in the local file override the shared file.
2. Run `git rev-parse --git-dir` and `git status --short`. Inventory every
   tracked, staged, and untracked path before any branch operation.
3. Select exactly one branch below, in order:
   - If the git directory contains `.git/worktrees/`, read [the in-worktree final answer](references/plan_final_answer_in_worktree.md).
   - Otherwise, if effective `disabled` is `true`, check out the task branch,
     defaulting its name to the task-directory slug. Reuse that branch if it
     already exists; create it if it does not. Attempt the checkout only when it
     preserves every inventoried change. If safety cannot be established or the
     checkout conflicts, leave the current branch and worktree untouched and
     read [the pending final answer](references/plan_final_answer_pending.md).
     Otherwise read [the disabled-workspace final answer](references/plan_final_answer_disabled.md).
   - Otherwise, read [the worktree-setup final answer](references/plan_final_answer.md).
4. If checkout changed the branch, synchronize the plan's `branch` and `sha` frontmatter with the checked-out branch and its `HEAD`, then re-read that frontmatter.
5. Substitute the actual plan path, checked-out branch, and artifact permalink. Include the permalink only when the host supplied one.
6. If any authorized comment action failed, select the pending template even
   when no checkout was needed and list each failed thread operation. Respond
   with the selected template and no additional summary.

This step is complete only when one mode was selected from observed
configuration and git state, every pre-existing change is preserved, any branch
checkout either succeeded safely or produced the pending handoff, all authorized
comment operations are reconciled, and every value in the response is factual.
