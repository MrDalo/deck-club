# Iteration handoff contract

Choose exactly one status after evaluating its gate. Replace every placeholder, omit fields marked optional when unknown, and use `None` for an empty required section. Preserve local artifact paths and add optional permalinks when an artifact integration supplied them.

## Status gates

- **Complete** — every feedback item is complete, rejected with evidence, or deferred by the user; required automated and manual verification is complete; deviations are accounted for; the remaining diff is intentional.
- **Awaiting manual verification** — implementation and required automated checks are complete, but one or more named manual checks still need human confirmation.
- **Blocked** — progress requires one specific missing input, external result, or user decision, or a required check is failing without a safe in-scope repair.

## Complete

````markdown
### Status

- Iteration: Complete
- Ticket: [TICKET-ID](ticket URL) <!-- optional -->
- Workspace: [branch and linked-worktree/ordinary-checkout mode]

### Resolved feedback

- [feedback ID] — [outcome and evidence]

### Verification

- `[command or manual check]` — passed

### Deviations

- [intentional deviation, addition, rejection, or user-approved deferral with reason]

### Next step

The implementation is ready for pull-request preparation:

```text
$describe-pr
```

### Artifacts

- [Plan or authoritative artifact](local path or optional permalink)
````

## Awaiting manual verification

```markdown
### Status

- Iteration: Awaiting manual verification
- Ticket: [TICKET-ID](ticket URL) <!-- optional -->
- Workspace: [branch and linked-worktree/ordinary-checkout mode]

### Implemented feedback

- [feedback ID] — [implemented outcome]

### Automated verification

- `[command]` — passed

### Manual verification required

1. [Exact action]
2. [Expected observable result]

### Deviations

- [accounted deviation or `None`]

Reply with the observed results so I can close the iteration.

### Artifacts

- [Plan or authoritative artifact](local path or optional permalink)
```

## Blocked

```markdown
### Status

- Iteration: Blocked
- Ticket: [TICKET-ID](ticket URL) <!-- optional -->
- Workspace: [branch and linked-worktree/ordinary-checkout mode]

### Completed

- [feedback ID] — [verified outcome, or `None`]

### Blocker

- [feedback ID] — [specific missing evidence, failing check, or material decision]
- Evidence: [path, command output, log, or reproduction result]

### Needed from you

- [One precise input or mutually exclusive decision]

### Artifacts

- [Plan or authoritative artifact](local path or optional permalink)
```
