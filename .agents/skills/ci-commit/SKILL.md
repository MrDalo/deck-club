---
name: ci-commit
description: Commit the changes made during the current session as focused, reviewable commits.
disable-model-invocation: true
---

# Commit Changes

Treat explicit invocation as authorization to create commits now. Use the
conversation as the ownership ledger: commit the changes produced for the
current task, preserve unrelated work, and finish without asking for another
confirmation.

Pushing, amending existing commits, bypassing hooks, and destructive cleanup are
separate operations and require explicit user authorization.

## 1. Reconstruct the owned change set

Review the conversation, repository instructions, and commands already run.
Then inspect all worktree states:

```bash
git status --short
git diff --stat
git diff
git diff --cached --stat
git diff --cached
```

Inspect the contents of relevant untracked files because `git diff` omits them.
Classify every changed path as one of:

- owned: created or changed for the current task;
- required consequence: generated or lockfile output that repository convention
  requires for an owned source change;
- unrelated: pre-existing user work, another agent's work, or a change whose
  ownership the session cannot establish;
- debris: scratch files, dummy data, temporary test scripts, debug output, or
  incidental generated files.

Production tests written for the task are owned changes, not temporary test
scripts. Keep unrelated and debris paths out of every commit. Exclude workflow
scratch and control artifacts identified by repository configuration or
`.gitignore`, including `.agent-work/` when present. Retain required production
outputs even when the workflow produces them.

If the repository is in a merge, rebase, cherry-pick, or revert, or if already
staged content overlaps unrelated work, read
[`references/commit-edge-cases.md`](references/commit-edge-cases.md) before
proceeding.

**Completion criterion:** every staged, unstaged, and relevant untracked path is
accounted for; each proposed commit contains only owned changes and required
consequences; no proposed commit contains excluded workflow artifacts,
unrelated work, or debris.

## 2. Design the commit series

Partition the owned change set by intent. Use one commit when all changes serve
one coherent outcome; use multiple commits when a reviewer could understand,
revert, or reuse the groups independently. Keep coupled implementation, tests,
documentation, migrations, and required generated outputs together when
separating them would leave an invalid or misleading intermediate state.

For each commit, define:

- the exact files or hunks it owns;
- the reason those changes belong together;
- an imperative subject that states the outcome;
- an optional body when the motivation or non-obvious tradeoff is not clear
  from the diff.

Follow repository-specific commit conventions when present. Message text should
explain the reason or outcome rather than narrate filenames.

**Completion criterion:** every owned change and required consequence appears in
exactly one planned commit, every group is coherent on its own, dependency order
is valid, and each commit has a final message before staging begins.

## 3. Stage one exact commit

Stage only the current group, naming exact paths:

```bash
git add -- path/to/file another/path
```

Use patch staging when a file mixes intents:

```bash
git add -p -- path/to/file
```

Never use broad staging forms such as `git add .`, `git add -A`, or an
unreviewed glob. Preserve pre-existing staged work that does not belong to the
current commit. For partial staging, pre-existing staged content, rename/delete
handling, or submodules, follow
[`references/commit-edge-cases.md`](references/commit-edge-cases.md).

Audit the exact candidate commit:

```bash
git diff --cached --stat
git diff --cached
```

Check for accidental credentials, unrelated formatting churn, debugging code,
conflict markers, debris, and excluded workflow scratch or control paths.
Correct the index with path-specific or patch-based staging and repeat the audit
until it matches the planned group exactly.

**Completion criterion:** the complete cached diff has been read; it matches
one and only one planned commit; every staged line is intentional; the cached
path list contains no excluded or unowned path.

## 4. Create and verify the commit

Create the commit with the planned message:

```bash
git commit -m "<imperative subject>"
```

Allow configured hooks to run. Never add `--no-verify` unless the user
explicitly authorized bypassing hooks. When a hook fails or mutates files, read
the matching branch in
[`references/commit-edge-cases.md`](references/commit-edge-cases.md), repair the
candidate safely, and re-audit the cached diff before retrying.

After success, inspect the created object and current worktree:

```bash
git show --stat --patch --no-ext-diff HEAD
git status --short
```

Repeat steps 3 and 4 for every remaining planned commit.

**Completion criterion:** every planned commit exists with the intended message
and content, all configured hooks completed successfully, and the remaining
status contains no owned change that was planned for this invocation.

## 5. Report the result

Return:

- each new commit hash and subject, in creation order;
- the intent of each commit;
- hook or repository check results that ran during commit creation;
- every remaining changed path, classified as intentionally untouched; or an
  explicit statement that the worktree is clean.

If no owned changes exist, say that no commit was created. If Git cannot safely
create the requested commits after the recovery paths in the edge-case
reference are exhausted, report the exact blocking state and the evidence used
to identify it; do not claim completion.

**Completion criterion:** the report accounts for every commit created and
every remaining worktree change, and its hashes and status agree with Git's
current state.
