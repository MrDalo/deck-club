---
name: configure-workspaces
description: Propose and generate portable workspace configuration for a repository.
disable-model-invocation: true
---

# Configure workspaces

Build an evidence-backed workspace configuration, let the user review the complete JSON, then write only what they approve.

The shared file is `.agent-work/workspace.json`. Machine-specific overrides belong in `.agent-work/workspace.local.json`, which must be ignored by Git. Compatible task runners use these files to create worktrees immediately for a task.

## 1. Resolve the repository

Run `git rev-parse --show-toplevel` from the current directory. Use the returned root and state it in one sentence.

If the command fails, ask exactly one question:

> Which repository should I configure? Send its path.

Resolve the reply with `git -C <path> rev-parse --show-toplevel`. Quote the path safely in every command. Keep asking only when the supplied path is not a Git repository.

**Complete when:** one canonical Git root has been selected and every later read or command is anchored to it.

## 2. Inventory before inferring

Read these files when present:

- `.agent-work/workspace.json` and `.agent-work/workspace.local.json`
- `AGENTS.md`, `.agent-work/tasks/`, and project-documented agent or runtime configuration
- `package.json`, lockfiles, `Makefile`, and the relevant setup sections of `README.md`
- `.gitignore` and `scripts/create_worktree.sh`

Inspect `git remote -v`. Inspect sibling directories only when the selected repository or the user's request indicates a coordination repository or multi-repo workspace. Never read the contents of candidate secrets; check only whether names such as `.env`, `.env.local`, and `.env.development.local` exist.

Treat an existing workspace configuration as the baseline. Record, without writing yet:

- whether the workspace is single-repo or multi-repo;
- which repository should launch sessions by default;
- the source remote/ref for every repository;
- the setup command supported by project evidence;
- existing local-only files worth copying into worktrees;
- which values are shared and which are machine-specific.
- whether an existing local overlay will be retained, updated, or removed.

For the inference rules and evidence priority, read [`references/project-inference.md`](references/project-inference.md) now.

**Complete when:** every proposed repository, ref, setup command, copy glob, and local override traces to an inspected fact or an explicitly identified default; unresolved remote or primary-repo choices have been asked of the user.

## 3. Construct the candidate

Before drafting JSON, read [`references/config-contract.md`](references/config-contract.md) in full. It is the package's schema and merge-semantics source of truth.

Default to one repository:

```json
{
  "disabled": false,
  "pathTemplate": "~/.agent-work/workspaces/{{ TASKSLUG }}/{{ REPOBASENAME }}",
  "branchTemplate": "{{ TASKSLUG }}",
  "sourceRef": "origin/main",
  "setupCommand": "",
  "copyGlobs": [],
  "repos": [
    {
      "localPath": ".",
      "description": "Selected repository",
      "primary": true
    }
  ]
}
```

Add sibling repositories only when project evidence or the user requires them. Put team-shareable behavior in `workspace.json`; put machine paths or personal overrides in `workspace.local.json`. Include only useful copy globs that exist or intentionally match local variants.

Hold the candidate until it passes Step 4. Do not ask for approval of unchecked JSON.

**Complete when:** complete candidate contents exist for every file that may be written, with all shared values and local overrides placed in their correct file.

## 4. Validate, present, and revise

Validate the candidate without executing setup commands or creating worktrees.

### Syntax and schema

- Parse each document with an available JSON parser, such as `jq empty` or `python3 -m json.tool`, by feeding it the exact candidate contents.
- Apply every root, repository-entry, override, merge, and template rule in [`references/config-contract.md`](references/config-contract.md).
- Require unique `localPath` values within each `repos` array.
- Require exactly one effective `primary: true` after overlays for a multi-repo proposal, and exactly one in a newly generated multi-repo shared configuration. Keep the sole repository explicit as primary in newly generated single-repo configurations.
- Accept `$patch: "delete"` only on a repository entry in `workspace.local.json`.
- Keep `branchTemplate` at the root; reject it inside a repository entry.
- Reject template variables other than `{{ TASKSLUG }}` and `{{ REPOBASENAME }}`.

### Repository and ref checks

For every effective repository:

- resolve `localPath` relative to the selected repository and verify the directory exists;
- run `git -C <resolved-path> rev-parse --show-toplevel` and verify it names that repository;
- identify the effective `sourceRef` after root and per-repo overrides;
- when the ref begins with `<remote>/`, verify `<remote>` exists and the remote-tracking ref resolves locally; report a missing local ref rather than fetching automatically.

### Setup and copy checks

- Explain each non-empty setup command in one sentence and show why repository evidence supports it. Do not run it during configuration.
- Confirm each literal copy path exists. For wildcard globs, confirm at least one intended match or identify the glob as deliberately future-facing.
- Confirm the repository `.gitignore` contains an exact `.agent-work/workspace.local.json` rule when the local file exists or will be written; include that edit in the proposal when absent.
- Compute the effective config mentally using shared → local → per-repo precedence, while concatenating and de-duplicating `copyGlobs`. Confirm the resulting repositories, refs, setup commands, and primary repo match the proposal.

After every check passes, the first response after inspection must contain:

1. the complete proposed `.agent-work/workspace.json` in a fenced `json` block;
2. the complete proposed `.agent-work/workspace.local.json` in a second fenced `json` block when local overrides are useful;
3. an explicit deletion notice when an existing local file will be removed;
4. the proposed `.gitignore` addition when one is required;
5. one sentence identifying any assumption that needs attention;
6. this final line:

> Tell me what to change, or approve this config.

On feedback, rebuild and revalidate the candidate, then print the complete proposal again. A partial fragment never replaces the full reviewable JSON. Approval must be explicit; presenting a proposal is not approval. If validation itself changes previously displayed JSON, show the full corrected proposal and obtain approval again.

**Complete when:** every validation item passes and the user has explicitly approved the exact full proposal that passed.

## 5. Write and verify

Immediately before writing, re-read any existing workspace files. If they changed since inspection, stop and reconcile the new contents through the proposal loop.

Create `.agent-work/` when needed, then write the approved JSON with a trailing newline:

- always write `.agent-work/workspace.json`;
- write `.agent-work/workspace.local.json` only when the approved proposal contains local overrides;
- remove an existing `.agent-work/workspace.local.json` only when the full proposal explicitly included its deletion and the user approved it;
- add one exact `.agent-work/workspace.local.json` entry to `.gitignore` when the local file is not already ignored.

Preserve unrelated `.gitignore` contents. Do not stage, commit, or push unless the user separately asks.

Re-read both written files, parse them again, repeat the semantic checks affected by disk paths, run `git diff --check`, and inspect `git status --short` scoped to the written files and `.gitignore`.

**Complete when:** disk contents equal the approved proposal, both files parse, semantic validation still passes, the local file is ignored, and the scoped diff has no whitespace errors.

## 6. Hand off

Summarize:

- files written;
- number of effective repositories and the primary repository;
- rendered path-template intent;
- setup commands, if any;
- copy-glob intent;
- validation results.

Then explain:

> The workspace configuration is ready. Use the task runner's immediate workspace option to provision it now. If the host provides a workspace settings view or permalink, that is an optional way to review or share the configuration; the files remain authoritative.
>
> The task runner creates a worktree for each configured repository, copies the configured local files, runs each setup command, and starts the task in the primary repository's worktree.

For a team configuration, recommend committing `.agent-work/workspace.json` and any `.gitignore` change while keeping `.agent-work/workspace.local.json` untracked. Show the relevant paths in `git status`; leave staging to the user unless they asked for it.

**Complete when:** the user has the written-file inventory, effective behavior, validation outcome, task-runner next action, and correct shared-versus-local commit guidance.
