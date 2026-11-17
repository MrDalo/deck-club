---
name: describe-pr
description: Create or refresh a reviewer-grade GitHub pull-request description, optional walkthrough, and handoff.
disable-model-invocation: true
---

# Describe a pull request

Turn the actual change into a reviewer map: why it exists, what users gain, how the implementation works, where risk lives, and how to verify it. An explicit invocation authorizes creating or updating the task's pull request; repository git-safety rules still govern commits and pushes.

## 1. Resolve the target and preserve the worktree

Read [PR targeting and diff acquisition](references/pr_targeting_and_diffs.md), then follow its decision table.

Capture the repository, PR number and URL, state, base and head refs, current branch/worktree state, and output diff mode. Prefer an explicitly supplied PR. Otherwise use the current branch's PR or create one from clearly task-owned work during this step. Ask the user to select a target only at the ambiguity branch defined in the reference.

This step is complete only when one PR target is unambiguous, every task-owned change is included, unrelated changes remain untouched, and the exact diff source is recorded.

## 2. Build an evidence ledger

Collect PR and repository metadata, the complete changed-file inventory, additions/deletions, commits, and the complete diff. Read enough surrounding code to identify ownership and runtime effects; account explicitly for binary files, generated files, submodules, renames, and patches omitted by GitHub. Read the ticket and task artifacts when present, and derive the task slug and ticket link from evidence rather than naming guesses alone.

Record evidence for:

- the user problem and post-ship outcome;
- each user-facing behavior, API/schema/data change, and important internal boundary;
- breaking changes, migrations, compatibility, rollout, deliberate omissions, and surprising decisions;
- tests and checks actually run, with their real results;
- the files or line anchors that let a reviewer verify each material claim.

This step is complete only when every changed file has a disposition and every intended description claim has diff, code, artifact-file, or command-result evidence.

## 3. Choose the walkthrough branch

Generate the interactive walkthrough when the PR has **at least 300 changed lines and at least 5 changed files**, or when the user explicitly requests one. Otherwise record that it was skipped and proceed without a walkthrough link.

For the walkthrough branch, read [walkthrough production](references/pr_walkthrough.md) and [the HTML walkthrough source](references/pr_walkthrough_example.html) completely before writing. Follow both through their validation criteria. Build the walkthrough from code evidence before comparing the implementation with its plan.

This step is complete when either the skip decision is supported by exact counts, or the walkthrough passes every structural, link, diff-injection, and artifact-sync check in the walkthrough reference.

## 4. Compare the implementation with the plan

If the task directory contains a plan, compare every planned item with the final diff and classify it as implemented as planned, changed, added, or omitted, including the reason and reviewer impact. Use an `implementation-reviewer` subagent when that specialist is available; otherwise perform the same exhaustive comparison directly. If no plan exists, record that fact.

This step is complete only when every plan item and every material unplanned change has exactly one classification.

## 5. Draft the reviewer map

Read [the Markdown template](references/pr_description_template.md) and [visual guidance](references/show-me.md) completely. Fill the template from the evidence ledger:

- keep the opening problem statement direct and outcome-oriented;
- link user-facing and implementation claims to the relevant GitHub file or line diff;
- use the smallest structural visual that makes ownership, sequence, or data flow easier to review;
- surface migrations, breaking behavior, constraints, rollout, deliberate omissions, and uncertainty;
- give reproducible verification steps and distinguish observed results from suggested checks;
- include only valid header links, including the walkthrough only when it exists.

Write in plain human language. Keep implementation detail proportional to review value, while retaining every material behavior, risk, deviation, and verification fact.

This step is complete only when every template section is resolved, every link and statistic is real, every material changed-file group is represented, and no placeholder remains.

## 6. Save, publish, and verify

Save to `.agent-work/tasks/{task-directory}/pr-description.md` when a matching task directory exists; otherwise save to `.agent-work/tasks/pr-{number}/description.md`. Capture a host-provided artifact permalink when one is available.

Update the resolved PR with:

```bash
gh pr edit {number} --body-file {output-path}
```

Read the PR body back with `gh pr view` and compare it with the saved file. Confirm the PR remains open, its base/head refs are correct, and every header link resolves to the intended target.

This step is complete only when the saved artifact and remote PR body match exactly and the PR URL is known.

## 7. Hand off

Briefly read the ticket and key task artifacts so optional host permalinks are available. Then read [the final-response contract](references/describe_pr_final_answer.md) and follow it. Report the walkthrough as created or skipped, observed verification, plan alignment, and any unresolved risk.

The skill is complete only when the final response contains every applicable status item and no placeholder, invented result, or dead link.

## Guardrails

- Treat the diff as authority for implemented behavior and the ticket/plan as authority for intent.
- Preserve unrelated worktree changes. Stage and commit only files proven to belong to this task.
- Keep credentials, tokens, private environment values, and unrelated local paths out of artifacts and PR bodies.
- Describe checks as passing only after observing a successful result.
- Keep closed or merged PRs immutable unless the user explicitly asks to modify them.
