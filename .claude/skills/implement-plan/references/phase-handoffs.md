# Phase handoffs

Read this reference when a phase reaches a human gate or cannot reach it. Choose
one structure; never describe a blocked phase as ready.

## Phase ready

```markdown
## Phase <N>: <title> — ready for review

### Implemented

- <completed outcome>

### Automated verification

- `<exact command>` — passed
- `<exact command>` — <accepted non-passing disposition, when present>

### Deviations

- None
<!-- Replace with one bullet per deviation when present. -->

### Manual verification

- [ ] <manual step from the plan>
<!-- Use "None required by this phase" when the plan has no manual checks. -->

Please report the manual results and approve this phase. After approval I will
create its checkpoint commit unless you want the changes left uncommitted.
```

For an authorized consecutive range, title the report `Phases <N>–<M> — ready
for review`, group implementation and automated evidence by phase, and include
every manual check from the range. Preserve phase boundaries in the report even
though the human gate was deferred.

## Phase blocked

Use the blocked structure in
[`deviations-and-recovery.md`](deviations-and-recovery.md), followed by the phase
ledger state and the smallest decision required from the human. Include work
already completed only when it helps the human choose; keep it clearly separate
from the unresolved obligation.

## Selected range complete, plan still open

After approval and checkpointing, name the next incomplete phase and stop:

```markdown
Phase(s) <N>–<M> approved and checkpointed in `<commit(s)>`.

Next queued phase: <K> — <title>. Invoke `$implement-plan` again to continue.
```

If the user chose an uncommitted workflow, replace the commit clause with
`approved and intentionally left uncommitted`.
