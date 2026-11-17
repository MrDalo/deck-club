# Outline revision rules

Use the following audit for any substantive revision. Its purpose is to recompute the outline from the changed constraints, rather than patching one sentence while leaving stale downstream structure.

## Build the coverage map

Create a private map from each desired-end-state requirement and accepted decision to:

- its owning phase;
- affected layers, services, modules, and files;
- prerequisites and consumers;
- automated proof;
- any irreducible manual proof.

Also map each phase contribution back to a requirement or verified constraint. The map is complete when there are no orphan requirements, unexplained phase items, or duplicate owners.

## Re-slice around observable outcomes

Prefer a thin vertical slice that produces one observable outcome across the layers it needs. A slice may include schema, API, UI, orchestration, migration, and tests when all are required for that outcome. A shared foundation may stand alone only when it exposes a stable boundary that can be proved independently and makes a later consumer simpler.

Use these questions for every phase:

1. What becomes true at the phase boundary?
2. Which smallest cross-boundary change makes that outcome real?
3. Can its proof run with only this and earlier phases?
4. Does it surface an integration risk earlier than a layer-by-layer sequence would?

Horizontal staging such as “all types, then all APIs, then all UI, then tests” defers integration and proof. Re-form it around user-visible or system-observable outcomes when the work permits. Domain constraints sometimes require a foundation first; state that dependency and give the foundation its own executable proof.

The slicing pass is complete when each phase has one coherent outcome, all required layers for that outcome, and proof available at its boundary.

## Recompute dependencies and order

Derive order from real dependencies, not the previous numbering. For every phase, list the contracts, migrations, generated artifacts, configuration, fixtures, and behavior it consumes. Place each prerequisite in the same or an earlier phase.

Then check:

- no phase requires a later phase to compile, run, migrate, or verify;
- no dependency cycle exists;
- compatibility work appears before the first incompatible consumer;
- migrations and rollback or coexistence behavior are paired with their first use;
- cross-repository or external prerequisites name their owner and readiness condition;
- phase numbering, titles, and the implementation overview reflect the recomputed order.

Preserve an existing phase identifier when its observable outcome is unchanged. Split, merge, rename, reorder, or reopen phases when the changed dependency graph requires it.

The dependency pass is complete when a topological reading of the phases is executable from first to last and every edge has an identified prerequisite.

## Refresh the change outline

Update file ownership and structural views from current repository evidence. Show the smallest useful combination of:

- a compact file tree when ownership or placement matters;
- focused existing-shape diffs for changed interfaces, fields, tables, routes, or component relationships;
- complete target shapes for new contracts where a diff would obscure the result;
- test files beside the behavior they prove.

Keep descriptions at interface resolution. Full implementations belong in the detailed plan or implementation. Use proper tree glyphs (`├──`, `└──`, `│`); in diff trees, prefix additions and changed (`~`) lines with `+`, removals with `-`, and unchanged context with a space.

The change-outline pass is complete when a reader can identify ownership, integration seams, and key signatures without mistaking the outline for implementation code.

## Design phase proof

Inspect the repository's current scripts, CI configuration, and neighboring tests before naming commands. For every phase:

- **Automated Verification** contains runnable commands and identifies the behavior or boundary each proves.
- Tests are introduced in the same phase as the behavior they protect.
- Broad typecheck, lint, or build commands supplement focused behavioral tests; they do not replace them when focused tests are feasible.
- **Manual Verification** contains concrete observation steps only where human judgment, a device, an external integration, or a visual result makes automation insufficient.
- A phase with no meaningful manual check may omit that subsection.

Proof coverage is complete when every phase outcome has at least one credible check, every command exists or is explicitly introduced by that phase, and no check relies on a later phase.

## Reconcile open and completed state

Move an answered open question into the section it affects and remove the question entry. Add a newly exposed blocking decision to **Open Questions** with the exact consequence of leaving it unresolved.

Preserve a checked implementation-overview item only when the revised phase's outcome and proof are already satisfied. Reopen a completed item whose scope or acceptance proof changed, and state the newly required work in that phase. Keep overview checkboxes and phase sections identical in title, order, count, and state.

The state pass is complete when open questions contain only live decisions and every completion marker remains evidence-backed.
