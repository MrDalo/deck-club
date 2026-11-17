# Workspace configuration

Read this reference when creating, translating, or diagnosing workspace config.
The helper is the executable source of truth for merge and validation behavior;
this file defines the contract humans need to review.

## Discovery and precedence

Configuration is rooted at the selected Git repository:

1. Built-in scalar defaults
2. `.agent-work/workspace.json` (shared)
3. `.agent-work/workspace.local.json` (machine-local)

Later scalar values win. `repos` merge by `localPath`. A matching local repo entry
overrides its shared fields; a new local path adds a repo; a local entry with
`"$patch": "delete"` removes it. `$patch` is valid only in the local file.

`copyGlobs` is the exception to scalar replacement: concatenate root shared, root
local, repo shared, then repo local lists, de-duplicating in first-seen order. An
omitted list contributes nothing.

## Fields

Root fields:

- `disabled` (boolean, default `false`): select branch-only behavior.
- `pathTemplate` (string): destination for each repository.
- `branchTemplate` (string): one branch name rendered for each repository.
- `sourceRef` (string, default `HEAD`): base commit for a new branch.
- `setupCommand` (string, default empty): command run after copying.
- `copyGlobs` (string array, default empty): repo-relative local files to copy.
- `repos` (non-empty array): repository entries.

Repository fields:

- `localPath` (required string): path relative to the selected repository; `.` is
  the selected repository.
- `description` (optional string): human label.
- `sourceRef`, `setupCommand`, and `copyGlobs`: per-repository overrides; globs add.
- `primary` (optional boolean): default implementation working directory.

One repository is implicitly primary. In a multi-repository config, mark exactly
one `primary: true`; when none is marked, `localPath: "."` is the compatibility
fallback. Multiple primary repositories, or no selectable fallback, are errors.

Only `{{ TASKSLUG }}` and `{{ REPOBASENAME }}` are valid template variables.
`REPOBASENAME` is calculated from the resolved Git repository root, not the raw
`localPath`. `~` is expanded after rendering. A relative rendered destination is
resolved from the selected repository root.

## Preserved default

When neither config file nor a legacy script exists, `init --write` creates:

```json
{
  "disabled": false,
  "pathTemplate": "~/.agent-work/workspaces/{{ TASKSLUG }}/{{ REPOBASENAME }}",
  "branchTemplate": "{{ TASKSLUG }}",
  "repos": [
    {
      "localPath": ".",
      "description": "Selected repository",
      "sourceRef": "HEAD",
      "setupCommand": "",
      "copyGlobs": [
        ".env*",
        ".agent-work/workspace.local.json"
      ],
      "primary": true
    }
  ]
}
```

## Validation and safety boundaries

The planner validates the complete effective workspace before creation:

- every `localPath` resolves to an existing Git worktree root;
- duplicate `localPath` entries in either configuration, duplicate repository
  roots, and duplicate destinations are rejected;
- branch names pass `git check-ref-format --branch`;
- every `sourceRef` resolves to a commit when its branch must be created;
- an existing destination is reusable only when Git registers it for the same
  repository and exact branch;
- a branch checked out elsewhere is a conflict;
- copy globs are relative, remain within the repository, and cannot include `.git`;
- directories matched for copying cannot contain the destination worktree;
- setup commands are strings and are displayed during planning.

An unmatched copy glob is reported and is not an error; local files are commonly
optional. Copy matches can overwrite the corresponding destination path because
that is the explicit purpose of `copyGlobs`.

## Legacy script migration

When `scripts/create_worktree.sh` exists and JSON config does not, treat the script
as a functional contract, not as a command to execute. Inventory every input,
default, validation, branch/base choice, path calculation, copied file or directory,
setup command, multi-repository loop, and failure behavior. Translate each into the
JSON schema. Keep the script in place. When a behavior has no exact representation
or more than one plausible mapping, show the complete proposed JSON and obtain the
user's decision before writing it.

Migration is complete only when every side effect in the script is either mapped
to a field or explicitly listed as unsupported; the script itself remains unchanged.
