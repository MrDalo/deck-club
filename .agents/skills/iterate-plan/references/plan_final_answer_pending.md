# Pending plan handoff

Use this response when the revised plan content is available but branch routing
or an explicitly authorized comment operation did not complete. Replace every
placeholder and list every blocker.

````markdown
### Plan handoff pending

The revised plan is available at [PLAN_ARTIFACT], but implementation should not
start yet.

Pending items:

- [CHECKOUT OR COMMENT OPERATION]: [OBSERVED FAILURE AND REQUIRED NEXT INPUT]

The current branch and all pre-existing worktree changes were preserved. Resolve
the items above or ask me to retry them before invoking `$implement-plan`.
````

This handoff is complete when it contains the usable plan location, every failed
operation, and no implementation-ready claim.
