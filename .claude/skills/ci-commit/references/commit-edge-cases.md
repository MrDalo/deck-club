# Commit Edge Cases

Read the matching section when its condition appears. Return to the numbered
process in [`../SKILL.md`](../SKILL.md) after the branch is resolved.

## In-progress Git operation

Detect merge, rebase, cherry-pick, or revert state from `git status`. A commit
created during one of these operations may complete or alter that operation,
which is outside ordinary session-change committing.

- If the user explicitly asked to continue the operation, follow Git's current
  instructions and preserve its intended index.
- Otherwise, leave the operation and index unchanged and report the exact state
  as a blocker. Never abort, continue, or skip it implicitly.

**Return condition:** the operation is explicitly in scope and its required
index is understood, or the branch stops with a precise blocker before any
commit is created.

## Pre-existing staged content

Treat the index as user-owned until the conversation establishes otherwise.

- If all staged content belongs to the next planned commit, keep it staged and
  audit it normally.
- If staged content forms a coherent later planned commit and dependency order
  permits, revise the series and commit that group first.
- If staged and unstaged lines in the same file have different owners or
  intents, inspect both `git diff --cached -- <path>` and `git diff -- <path>`.
  Add further owned hunks only when the resulting cached diff still represents
  a complete planned commit.
- If staged content is unrelated, belongs to another owner, cannot safely be
  committed first, or has an ambiguous boundary, preserve the index and report
  the overlap as a blocker. Do not reset or stash another owner's staged work.

**Return condition:** the cached diff contains exactly the current planned
commit without displacing staged work, or the original index is preserved and
the ambiguity is reported.

## Partial-file commits

Use `git add -p -- <path>` to select complete semantic hunks. Split or edit a
hunk only when the resulting staged and unstaged versions are both syntactically
and semantically valid. Re-read both sides:

```bash
git diff --cached -- path/to/file
git diff -- path/to/file
```

Avoid temporary worktree rewrites solely to manufacture a commit boundary.

**Return condition:** staged and unstaged versions each retain their intended
changes without duplicated, omitted, or malformed lines.

## Renames, deletions, and untracked files

Stage renames and deletions with exact old and new paths. Before staging an
untracked file, inspect its content and confirm its task ownership. A generated
file belongs only when repository convention requires committing it and the
owned change directly produced it.

**Return condition:** every staged path transition matches the owned diff, and
no uninspected untracked or incidental generated file enters the index.

## Submodules

Treat a submodule worktree and the parent repository's gitlink as separate
change sets. Commit inside the submodule only when the current task explicitly
owns that repository's changes. Stage the parent gitlink only when advancing it
is an intended consequence of the task.

**Return condition:** both repositories' statuses are understood, and each
created commit belongs to the repository whose content it records.

## Hook failure or mutation

Let hooks run with their configured behavior.

- If a hook reports a correctable problem in owned changes, fix it within the
  current task, restage exact paths, and re-read the full cached diff.
- If a hook formats or generates files, inspect the resulting staged and
  unstaged changes. Include only required, owned consequences and re-audit the
  candidate before retrying.
- If failure comes from unrelated repository state, unavailable infrastructure,
  missing credentials, or a fix outside task scope, preserve the worktree and
  report the exact command and failure. Never bypass the hook implicitly.

**Return condition:** the retry candidate has been fully re-audited after every
mutation and hooks pass, or the unchanged failure evidence is reported as the
remaining blocker.

## Nothing to commit

When no owned staged, unstaged, or untracked change exists, create no empty
commit. Report that result together with the current status classification.

**Return condition:** no commit was created and every visible worktree change is
accounted for as intentionally untouched.
