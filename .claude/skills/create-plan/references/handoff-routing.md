# Handoff routing

Load this reference only after the plan artifact passes its audit. It selects
one final answer and, in the disabled-workspace branch, prepares the task
branch.

## Gather routing state

1. Read `.agent-work/workspace.json` when it exists.
2. Read `.agent-work/workspace.local.json` when it exists.
3. Overlay local keys onto the shared configuration. The effective `disabled`
   value is the local value when present, otherwise the shared value, otherwise
   `false`.
4. Run `git rev-parse --git-dir` from the repository root.
5. Retain any shareable artifact permalink returned while writing or reading the
   plan. Permalinks are optional; their absence is not a routing failure.

A malformed workspace file makes routing indeterminate. Report that blocker
instead of guessing or changing branches.

## Select exactly one branch

Evaluate in this order.

### A. Current checkout is already a worktree

Condition: the resolved git directory contains `.git/worktrees/`.

Read [plan_final_answer_in_worktree.md](plan_final_answer_in_worktree.md). The
next action is implementation in the current worktree, regardless of workspace
config.

### B. Workspace creation is disabled

Condition: Branch A did not match and effective `disabled` is `true`.

Resolve the task branch from an explicit user-provided branch name; otherwise
use the task-directory slug. Inspect the current branch, working-tree status,
and local branch names before changing branches.

```text
git branch --show-current
git status --short
git branch --list --format='%(refname:short)'
```

- When already on the task branch, keep it.
- When the branch exists locally and switching preserves the working tree, run
  `git switch <task-branch>`.
- When it does not exist, run `git switch -c <task-branch>` to create it from
  the current `HEAD` and switch to it.
- When switching would overwrite, lose, or ambiguously carry unrelated work,
  leave the repository unchanged and report the blocker. A forced checkout is
  outside this workflow.

After the task branch is confirmed as current, read
[plan_final_answer_disabled.md](plan_final_answer_disabled.md).

### C. Workspace creation is enabled

Condition: neither A nor B matched.

Read [plan_final_answer.md](plan_final_answer.md). The next action is worktree
setup; this skill does not create that worktree.

## Render the artifact token

Replace `[PLAN_ARTIFACT]` in the chosen template with a Markdown link whose
label is the plan filename and whose target is the host-provided permalink. When no
permalink is available, substitute the repository-relative plan path as inline
code instead.

In the disabled template, also replace `[BRANCHNAME]` with the verified current
task branch. Preserve the template's headings, wording, command fence, and
ordering. Emit only the rendered template.

**Contract complete when:** one routing branch matches, its prerequisites hold,
every placeholder is replaced, the artifact location is usable, and the final
response is only the selected template.
