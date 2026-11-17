---
name: setup-worktree
description: Create or resume the configured worktree workspace for one task.
disable-model-invocation: true
---

# Setup worktree

Treat workspace creation as a transaction: preflight every repository first, then
apply, checkpoint, and report the exact state left behind.

Resolve this skill's directory as `SKILL_DIR`; all commands below use files from
that directory.

## 1. Resolve the task

From the selected repository, resolve the root with:

```sh
git rev-parse --show-toplevel
```

Get the task slug from the user's invocation or the established conversation.
Require a matching `.agent-work/tasks/<TASKSLUG>/` directory. Read `ticket.md` or
`task.md`, then every outline Markdown file present there, before deriving a slug
from context. If more than one task remains plausible, ask for the slug.

This step is complete when the repository root, task slug, and task directory are
unambiguous and the available task brief and outline have been read.

## 2. Resolve the early-exit branch

Read both config files when present:

- `.agent-work/workspace.json`
- `.agent-work/workspace.local.json`

The local file overrides shared scalar fields. If effective `disabled` is `true`,
preflight and check out the task branch in the current repository:

```sh
python3 "$SKILL_DIR/scripts/setup_worktree.py" branch --repo-root "$REPO_ROOT" --task-slug "$TASKSLUG"
python3 "$SKILL_DIR/scripts/setup_worktree.py" branch --repo-root "$REPO_ROOT" --task-slug "$TASKSLUG" --apply
```

The first command must report the intended create/reuse/switch action without an
error before the second runs. Then read [the `disabled` outcome](references/outcomes.md#disabled),
report it, and stop. A checkout failure is a partial failure, not a disabled
success.

When workspace setup is enabled, run:

```sh
git rev-parse --git-dir
git rev-parse --git-common-dir
```

If the two Git directories resolve to different paths, this checkout is already
a linked worktree. Read [the `already-in-worktree` outcome](references/outcomes.md#already-in-worktree),
report it, and stop unless the user explicitly asks for another worktree.

This step is complete when exactly one branch is selected: continue, stop in the
current linked worktree, or stop on the checked-out disabled-workspace branch.

## 3. Establish configuration

When either config exists, use it. When neither exists:

1. Inspect `scripts/create_worktree.sh` in the repository root if it exists.
2. If it exists, read [configuration and legacy migration](references/configuration.md#legacy-script-migration),
   translate every behavior into `.agent-work/workspace.json`. If a behavior has
   no exact representation or more than one plausible mapping, show that ambiguity
   and obtain the user's choice before writing.
3. Otherwise write the preserved single-repository default with:

   ```sh
   python3 "$SKILL_DIR/scripts/setup_worktree.py" init --repo-root "$REPO_ROOT" --write
   ```

Read [configuration](references/configuration.md) whenever translating a legacy
script, diagnosing a config error, or explaining merge behavior. Existing config
is user-owned; report an invalid field with its JSON path instead of silently
repairing it.

This step is complete when at least one valid config file exists and every legacy
behavior is mapped or explicitly resolved by the user.

## 4. Preflight the whole workspace

Run the planner and retain its JSON output:

```sh
python3 "$SKILL_DIR/scripts/setup_worktree.py" plan --repo-root "$REPO_ROOT" --task-slug "$TASKSLUG"
```

Inspect every repository record. The planner must account for all configured
repositories and prove, before mutation:

- the repository exists, and the source commit exists when branch creation needs it;
- the rendered branch is a valid Git branch;
- the destination is either absent or the same registered worktree on that branch;
- no branch is checked out at a conflicting path;
- every copy match stays below its source repository and excludes Git metadata;
- exactly one primary working directory can be selected;
- every setup command is shown verbatim.

The effective config is the setup contract. Ask only when a command needs
credentials, elevated privileges, or an external mutation beyond local
dependency/project setup.

This step is complete only when every record has action `create`, `attach`, or
`reuse`, with no planner error and no unresolved authorization.

## 5. Apply and checkpoint

Run:

```sh
python3 "$SKILL_DIR/scripts/setup_worktree.py" apply --repo-root "$REPO_ROOT" --task-slug "$TASKSLUG"
```

The helper creates or attaches each worktree, copies configured local files while
preserving relative paths, runs each configured setup command in its worktree, and
verifies repository identity and branch. `reuse` completes the same copy, setup,
and verification checkpoint so an interrupted run is resumable.

If any record fails, preserve the worktrees already created. Read
[partial failure and recovery](references/outcomes.md#partial-failure), report the
successful checkpoints and the exact failing operation, and work from that state.
Cleanup is a separate, explicitly approved action.

This step is complete when every configured repository has status `ready`, or the
partial state and one reproducible recovery command have been reported.

## 6. Report the result

Cross-check the helper result against `git worktree list --porcelain` for every
repository. Then read [the success outcome](references/outcomes.md#success) and
report the task slug, primary worktree, every repository's path and branch, whether
it was created/attached/reused, copied-file counts, and setup results.

The skill is complete only when all configured repositories are verified or an
honest partial-failure report names every retained worktree and its recovery path.
