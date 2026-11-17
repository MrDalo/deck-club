# 0007. FSRS-7 through ts-fsrs, behind a scheduler port

- Status: Proposed
- Date: 2026-11-17

## Context

Spec 6: scheduling uses FSRS through a maintained open-source
implementation, never a home-made algorithm, and every review (app, MCP,
battle) goes through the same engine. Spec 13 left the library open.

## Decision

Use `ts-fsrs` 6 (MIT, Node 24) with its `DefaultScheduler`: FSRS-7, desired
retention 0.9, learning steps 1 m / 10 m, relearning 10 m, fuzzing off so the
interval shown on a rating button is the interval the review gets. The study
module talks to it through the `ReviewScheduler` port
(`initialMemory`, `preview`, `review`); `TsFsrsScheduler` is the only file
that imports the library. Every FSRS card field is stored as its own column in
`study_states`; each review stores the previous memory so undo is exact.

## Consequences

The domain (queue, day boundary, streak, retention) stays library-free and
exhaustively testable. A future per-user optimiser (spec 12, out of scope) can
replay the stored review log. Upgrading ts-fsrs is a one-file change plus a
check that the stored fields still map.

## Alternatives considered

`ts-fsrs`'s deprecated `fsrs()` facade (FSRS-6; deprecated in v6); `femto-fsrs`
(smaller community, no learning-step support); writing FSRS ourselves (ruled
out by spec 6).
