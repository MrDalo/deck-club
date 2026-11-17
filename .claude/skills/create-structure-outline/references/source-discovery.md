# Source discovery

Resolve inputs before planning. The task directory may be a real directory or a symlink, so enumerate exact paths rather than relying on wildcard discovery.

## Resolve the task directory

1. If the user supplied an artifact file or directory, use that exact path.
2. Otherwise, use the task artifact directory or task slug already present in the prompt.
3. For a known ticket without an exact path, list `.agent-work/tasks/` with `ls -La` and identify the one directory whose name carries that ticket.
4. If no unique task can be resolved, ask the user which artifacts should drive the outline.

List a resolved directory with a trailing slash:

```bash
ls -La .agent-work/tasks/<task-directory>/
```

The trailing slash enumerates a symlinked directory's contents. Record existing two-digit filename prefixes now; this same listing determines the output document's next chronological index.

## Build the evidence ledger

Read in full:

- completed research reports;
- design discussions and recorded decisions;
- tickets, briefs, or requirements included with the task;
- prior structure outlines when revising or superseding one;
- other task-directory files that constrain implementation; and
- relevant repository files named by those artifacts.

Exclude files whose purpose is to ask the research questions. Their answers belong in the completed research report, which is the planning input. Record each excluded filename so exclusion is deliberate.

Follow citations and file references far enough to verify current ownership, target symbols, integration seams, test patterns, and repository verification commands. An artifact's claim about the codebase is a lead until the relevant source confirms it.

For each source, capture:

| Source | Role | Decisions or facts used | Conflicts / staleness |
|---|---|---|---|
| `<path>` | research, design, ticket, code, tests | <planning inputs> | <none or resolution> |

## Resolve conflicts

Apply [the document precedence defined by the skill](../SKILL.md#document-precedence). Within one tier, a clearly approved later decision supersedes an earlier proposal. Code evidence determines current mechanics; planning artifacts determine intended direction.

When a higher-precedence decision departs from current mechanics or earlier documents, carry that delta into the outline. When approval or intent is ambiguous, create an open question rather than choosing silently.

Discovery is complete only when every file in the task directory is either represented in the ledger or explicitly excluded, and every planning-critical repository claim has a current source location.
