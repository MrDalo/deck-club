# PR targeting and diff acquisition

Use this reference while resolving the pull request and building the evidence ledger. The goal is one explicit target and one complete, reproducible diff.

## Resolve the target

Apply the first matching row.

| Situation | Target | Required action |
| --- | --- | --- |
| The invocation includes a PR URL or number | That PR in the current repository | Resolve with `gh pr view {target}`. Analyze an open PR without checking out its branch. Treat a closed or merged PR as read-only unless the user explicitly requests a mutation. |
| The invocation names a branch | The open PR whose head matches that branch | Resolve with `gh pr list --state open --head {branch}`. When no PR exists and the branch is local with clear task work, push/create it; otherwise ask before choosing another target. |
| The current branch has an open PR | That PR | Resolve with `gh pr view`. The remote PR diff is canonical. |
| The current local branch has clear task-owned commits or dirty changes but no PR | A new PR from that branch | Separate unrelated changes, follow repository commit checks, commit only task-owned files, push with upstream, and create the PR against the repository default base. |
| The selected PR branch exists only remotely or belongs to a fork | The selected remote PR | Use `gh pr view` and `gh pr diff`; a checkout is unnecessary. Read extra source through GitHub or fetch into an isolated ref/worktree when local context is essential. |
| HEAD is detached, the current branch has no relevant work, or several PRs are equally plausible | User-selected PR | List up to ten open PRs with number, title, head, base, and author, explain the ambiguity, and ask one focused selection question. |

Before committing or pushing, inspect `git status --short --branch`, upstream tracking, the repository's contribution/commit guidance, and the candidate staged set. A mixed worktree stays mixed: include only files whose task ownership is supported by the diff or task artifacts.

For the new-current-branch row, finish target resolution before diff analysis:

```bash
git push -u origin {current-branch}
gh pr create --base {default-branch} --head {current-branch} --title {concise-title} --body ""
```

Run repository-required checks before the commit or push. If task-owned dirty changes cannot be separated from unrelated work with confidence, stop at the ambiguity branch rather than creating an incomplete or contaminated PR.

After resolution, capture:

```bash
gh pr view {number} --json url,number,title,state,baseRefName,headRefName,headRepositoryOwner,commits,files,additions,deletions
gh repo view --json nameWithOwner,defaultBranchRef
```

The resolved state must name repository, PR, state, base, head, URL, and whether the branch is local, remote, or fork-owned.

## Discover task context

Derive a candidate slug from the head branch by removing only its owner/category prefix (for example, `dev/eng-2612-cache` becomes `eng-2612-cache`). Search `.agent-work/tasks/` for an exact slug first, then for a case-insensitive ticket identifier such as `ENG-2612`. Use a directory only when its ticket or artifacts match the PR intent; if several match, keep the fallback `pr-{number}` directory and report the ambiguity.

Read ticket URLs from task artifacts when available. Treat branch-derived identifiers as search keys, not proof. Host-provided task or artifact permalinks are optional and may be absent in a standalone installation.

## Choose one canonical diff mode

### Existing PR — remote mode

Use the reviewer's server-side change:

```bash
gh pr diff {number}
```

This works for the current branch, another remote branch, and fork PRs. Do not substitute the current worktree diff for a selected remote PR.

### PR not created yet — local range mode

Resolve the default base and merge base, then inspect the committed range plus task-owned staged and unstaged changes:

```bash
git merge-base {base-ref} HEAD
git diff --find-renames {merge-base}...HEAD
git diff --cached
git diff
```

Once task-owned dirty changes are safely committed and the PR exists, switch to remote mode and verify that its file set matches the local evidence.

### API recovery mode

When `gh pr diff` omits or truncates content, paginate `gh api repos/{owner}/{repo}/pulls/{number}/files` and account for every `filename`, `previous_filename`, status, additions, deletions, and patch. For binary, generated, submodule, or oversized files without a patch, inspect metadata and the relevant base/head objects and label the limitation in the evidence ledger.

## Completeness checks

- Reconcile metadata additions/deletions and file count with the retrieved diff; exclude `+++` and `---` headers from hand-counted line totals.
- Track renames by destination path and retain the previous path in the explanation when it matters.
- Hash GitHub file anchors with the exact repository-relative destination path:

  ```bash
  printf '%s' 'path/to/file' | shasum -a 256
  ```

- Append `R{line}` for the new side and `L{line}` for the old side only after verifying the line in the PR view.
- For a multi-repository task, resolve, describe, inject, and publish each PR independently; never mix one repository's diff with another repository's walkthrough.

Diff acquisition is complete when the metadata inventory and evidence ledger account for the same files and changed lines, including every patchless file.
