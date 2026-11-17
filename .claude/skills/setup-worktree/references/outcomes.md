# Setup outcomes

Use exactly the outcome matching the reached checkpoint. Replace placeholders with
observed values; omit sections that have no records.

## Already in worktree

```text
You're already in a linked worktree at <CURRENT_PATH> on <BRANCH>.

No new worktree was created. Continue implementation here with the task outline at
.agent-work/tasks/<TASKSLUG>, or explicitly ask me to create another workspace.
```

## Disabled

```text
Workspace creation is disabled by <CONFIG_PATH>.

The task branch <BRANCH> is checked out in <REPO_ROOT>. No new linked worktree was
created. Continue implementation here with .agent-work/tasks/<TASKSLUG>.

To re-enable worktrees, change the effective `disabled` value or override it with
`"disabled": false` in .agent-work/workspace.local.json.
```

Name the config file that supplied the effective value. If checkout failed, use the
partial-failure outcome instead.

## Success

```text
Workspace for <TASKSLUG> is ready.

Primary working directory: <PRIMARY_PATH>

- <REPO>: <ACTION> at <PATH> on <BRANCH>; copied <N> paths; setup <RESULT>

Start implementation in <PRIMARY_PATH> using the task outline at
.agent-work/tasks/<TASKSLUG>.

Shared behavior is configured in .agent-work/workspace.json; machine-local
overrides belong in .agent-work/workspace.local.json.
```

`ACTION` is created, attached to an existing branch, or reused. `RESULT` is skipped
for an empty command or the successful command. Include one row for every configured
repository.

## Partial failure

```text
Workspace setup stopped during <OPERATION> for <REPO>: <ERROR>.

Retained state:
- <REPO>: <PATH>, branch <BRANCH>, checkpoint <STATUS>

Retry after correcting the cause:
<REPRODUCIBLE_COMMAND>
```

The helper is resumable: rerunning `apply` reuses a correctly registered worktree
and repeats copy/setup/verification. Prefer that recovery after fixing the cause.

### Cleanup or rollback

Cleanup deletes working directories and may delete new branches, so obtain explicit
approval after showing every target. Before proposing it, inspect each retained
worktree with:

```sh
git -C <WORKTREE_PATH> status --short
git -C <SOURCE_REPO> worktree list --porcelain
```

For each approved clean worktree:

```sh
git -C <SOURCE_REPO> worktree remove <WORKTREE_PATH>
```

Delete a branch only when the helper result says that run created it, the worktree
was removed, and the user separately approved branch deletion:

```sh
git -C <SOURCE_REPO> branch -d <BRANCH>
```

Use `-D` or `worktree remove --force` only after reporting the unmerged commits or
dirty files that would be discarded and receiving explicit approval for that exact
loss.
