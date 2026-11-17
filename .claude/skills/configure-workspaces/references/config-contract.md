# Workspace configuration contract

Read this file before constructing or validating either workspace configuration. Apply every rule; examples illustrate the contract but never override it.

## Files and precedence

`.agent-work/workspace.json` is shared team configuration. `.agent-work/workspace.local.json` is a Git-ignored, machine-specific overlay.

The effective root configuration is:

1. application defaults;
2. `workspace.json`;
3. `workspace.local.json`.

A later scalar value wins. Repository entries merge by matching `localPath`: a matching local entry overlays the shared entry, a new `localPath` adds a repository, and a local entry with `$patch: "delete"` removes the matching repository.

`copyGlobs` is the exception to scalar replacement. At every level it is additive: concatenate defaults → shared root → local root, then the effective root list → shared repo → local repo. De-duplicate exact strings while preserving first-seen order. An override extends the inherited list; it cannot remove earlier entries.

## Root object

The root is a JSON object. Supported fields are:

- `disabled`: boolean. `true` suppresses workspace-setup options that create worktrees. A later local `false` can re-enable a shared `true`.
- `pathTemplate`: string used to choose each worktree location. The default is `~/.agent-work/workspaces/{{ TASKSLUG }}/{{ REPOBASENAME }}`.
- `branchTemplate`: string used for the new branch name. It is root-only; the default is `{{ TASKSLUG }}`.
- `sourceRef`: string inherited by repositories unless overridden. The normal shared default is `origin/main` when that remote and ref exist.
- `setupCommand`: string inherited by repositories unless overridden. An empty string means no setup command.
- `copyGlobs`: array of strings, merged additively.
- `repos`: array of repository-entry objects.

Only `{{ TASKSLUG }}` and `{{ REPOBASENAME }}` are supported template variables. `TASKSLUG` is the task slug, such as `eng-123-small-fix`. `REPOBASENAME` is the basename of the repository's resolved `localPath`, such as `api` or `web`.

`disabled` applies only at the root. Setting it to `true` disables all workspace setup options. A consumer should identify which file contributed the effective `true` value.

## Repository entries

Every repository entry supports:

- `localPath`: required string, resolved relative to the selected repository. `.` names the selected repository; `../api` names a sibling.
- `description`: concise human-facing string.
- `primary`: boolean indicating the default session launch repository.
- `sourceRef`: per-repository override of the root value.
- `setupCommand`: per-repository override of the root value.
- `copyGlobs`: per-repository additions to inherited globs.

`$patch: "delete"` is additionally supported only on entries in `workspace.local.json`. Such an entry identifies the shared repository to remove by `localPath`.

Use unique `localPath` values in each file. A multi-repo shared configuration should mark exactly one repository `primary: true`, and a generated proposal must still have exactly one after applying local overlays. Changing primary locally requires setting the inherited primary to `false` as well as setting the replacement to `true`. Sessions launch in that repository's worktree by default. If none is marked, the task form asks the user to choose; that fallback is valid for existing configs but newly generated multi-repo configs must make the default explicit. A single-repo workspace is implicitly primary, but newly generated configs should still write `primary: true`.

Skills and repository instruction material load from all workspace repositories. Repo-local runtime configuration follows the repository a session launches from. Therefore, in a coordination workspace, primary normally belongs to the repository with the team's central agent policy or runtime configuration, even when most application code lives elsewhere. A workspace consumer can override primary per task.

## Shared single-repo example

```json
{
  "disabled": false,
  "pathTemplate": "~/.agent-work/workspaces/{{ TASKSLUG }}/{{ REPOBASENAME }}",
  "branchTemplate": "{{ TASKSLUG }}",
  "sourceRef": "origin/main",
  "setupCommand": "",
  "copyGlobs": [
    ".env",
    ".env.local",
    ".env.development.local",
    ".agent-work/workspace.local.json"
  ],
  "repos": [
    {
      "localPath": ".",
      "description": "Selected repository",
      "primary": true
    }
  ]
}
```

Keep only copy paths supported by the inspected repository; the list is illustrative.

## Shared coordination-repo example

```json
{
  "disabled": false,
  "pathTemplate": "~/.agent-work/workspaces/{{ TASKSLUG }}/{{ REPOBASENAME }}",
  "branchTemplate": "{{ TASKSLUG }}",
  "sourceRef": "origin/main",
  "setupCommand": "",
  "copyGlobs": [
    ".env",
    ".env.local",
    ".agent-work/workspace.local.json"
  ],
  "repos": [
    {
      "localPath": ".",
      "description": "Coordination repository"
    },
    {
      "localPath": "../api",
      "description": "API service and central agent configuration",
      "primary": true,
      "setupCommand": "bun install"
    },
    {
      "localPath": "../web",
      "description": "Web frontend",
      "sourceRef": "upstream/main",
      "setupCommand": "bun install"
    }
  ]
}
```

The selected repository does not have to be primary. Every listed path must exist and resolve to a Git repository.

## Local overlay examples

Extend a repository for one machine:

```json
{
  "copyGlobs": [
    ".env.private"
  ],
  "repos": [
    {
      "localPath": "../api",
      "sourceRef": "personal/main"
    }
  ]
}
```

Remove a shared repository locally:

```json
{
  "repos": [
    {
      "localPath": "../web",
      "$patch": "delete"
    }
  ]
}
```

The local file contains only overrides. Avoid copying the complete shared configuration into it because duplicated values drift.
