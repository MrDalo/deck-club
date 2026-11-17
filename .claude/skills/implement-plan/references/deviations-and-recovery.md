# Deviations and recovery

Read this reference when the implementation cannot follow the current phase
literally, a check fails, or evidence contradicts completed progress.

## Classify the difference

### Faithful adaptation

The repository requires a different local expression while the plan's behavior,
scope, interfaces, and acceptance criteria remain intact. Examples include a
moved helper with the same responsibility or syntax adjusted to the installed
library version.

Verify the adaptation against the same criteria, record it as a deviation, and
continue within the phase.

### Material decision

The difference changes scope, architecture, public behavior, compatibility,
data handling, security posture, dependencies, or a user-visible tradeoff. Stop
the phase and report:

```markdown
## Phase <N> blocked

- Expected: <what the plan requires>
- Found: <what the repository or runtime shows>
- Impact: <why proceeding would change the approved plan>
- Evidence: <paths, symbols, commands, or errors>
- Options: <small set of concrete ways forward with tradeoffs>
```

Resume only after the human chooses an option or supplies a revised plan. Keep
the phase ledger blocked in the meantime.

### In-scope implementation failure

A build, test, lint, or runtime failure introduced by phase work remains part of
the phase. Diagnose it, fix it, and rerun the failed check plus any checks its fix
can affect. The phase remains current until the evidence is green.

### Baseline or external failure

Reproduce the failure without relying on phase changes when safely possible.
Record the exact command, failure, evidence that it predates the phase, and its
effect on confidence. Ask for a disposition when it prevents proof of a success
criterion; otherwise carry it as a disclosed limitation.

### Contradicted completed work

When checked work is missing or demonstrably broken, preserve the prior marker
as evidence until the discrepancy is understood. Report the plan state and the
repository evidence, then ask whether to reopen that item. Reopen only with
human approval, and return it to the phase ledger before editing.

## Recovery boundary

Keep discoveries outside the selected phase in a follow-up list. Pull one into
the phase only when it is necessary to satisfy an existing criterion; state that
dependency as a deviation. New optional improvements remain outside the phase.

Recovery is complete when every difference has one classification, supporting
evidence, a recorded disposition, and—where the phase continues—verification
against the original acceptance intent.
