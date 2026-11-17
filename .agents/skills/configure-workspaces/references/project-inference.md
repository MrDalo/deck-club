# Project inference guide

Use this guide during inventory. The proposal must stay evidence-backed: prefer an existing explicit choice, then repository documentation, then tool-native project signals, then the defaults below.

## Preserve existing intent

Start from valid existing workspace files. Keep fields the user did not ask to change unless inspection proves they are stale or invalid. Explain every proposed removal or behavioral change.

When an existing file is malformed, preserve it on disk while preparing a corrected full proposal. Writing still waits for explicit approval.

## Choose topology

Use one repository unless at least one of these signals supports a coordination workspace:

- the user names additional repositories;
- an existing `repos` array names siblings;
- plans, tickets, or agent policy in the selected repository explicitly coordinate sibling projects;
- repository documentation identifies a multi-repo development setup.

The mere existence of sibling directories is not evidence that they belong in the workspace. For every added sibling, verify both its role and its Git root.

A coordination repository holds task-management or agent-coordination material and points at project repositories such as `../api` and `../web`; it may contain little or no application code. Its `localPath: "."` entry still names the selected repository, but another repository may be primary.

## Choose primary

For one repository, use `primary: true`.

For multiple repositories, prefer the launch directory that provides the team's central `AGENTS.md`, agent runtime configuration, tool-server configuration, or agent policy. If evidence points to different repositories or none, ask the user to choose. Mark exactly one primary in a newly generated shared config.

## Choose source refs

Keep a valid existing `sourceRef`. Otherwise:

1. inspect configured remotes and their local remote-tracking default branches;
2. use the user's stated remote preference;
3. use `origin/main` when it exists and no evidence conflicts;
4. when multiple plausible remotes remain, ask which one to use.

Per-repository source refs belong on the repository entry only when they differ from the root default. Validate using local refs; configuration does not fetch remotes.

## Choose setup commands

Prefer, in order:

1. a setup command already in valid workspace configuration;
2. an explicit bootstrap command in repository documentation;
3. a dedicated Makefile target or package script;
4. the package manager established by a lockfile and project metadata.

Use the smallest non-interactive command that prepares a fresh worktree. Put a common command at the root and only differences on repository entries. Use an empty string when evidence does not support a command. Configuration proposes and explains setup commands; it does not execute them.

## Choose copy globs

Candidate local files include:

- `.env`, `.env.local`, and environment-specific `.env.*.local` files;
- `.agent-work/workspace.local.json`;
- other documented, untracked machine configuration needed by a fresh worktree.

Inspect names and ignore status, never secret contents. Prefer exact paths over a broad glob when only known files are needed. Because `copyGlobs` merges additively, omit values already inherited. Put team-wide patterns in `workspace.json` and personal-only additions in `workspace.local.json`.

## Separate shared and local values

Shared configuration contains portable repository-relative paths, team source refs, repeatable setup commands, and common copy patterns. Local configuration contains personal remotes, machine-specific additions, or per-machine repository removals. Absolute machine paths and personal conventions belong in the local overlay.

The inventory is complete only when every proposed value has an evidence source or is visibly identified as a default, and every unresolved choice that changes behavior has been asked of the user.
