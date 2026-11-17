# 0007. FSRS through ts-fsrs, behind a scheduler port

- Status: Proposed
- Date: 2026-11-17

## Context

Spec 6: scheduling uses FSRS through a maintained open-source
implementation, never a home-made algorithm, and every review (app, MCP,
battle) goes through the same engine. Spec 13 left the library open.

## Decision

Use `ts-fsrs` 5.4 (MIT): FSRS-6 through `fsrs(generatorParameters(...))`,
desired retention 0.9, default learning steps 1 m / 10 m and relearning
10 m, fuzzing off so the interval shown on a rating button is the interval
the review gets. ts-fsrs 6 (FSRS-7, `DefaultScheduler`) requires Node 24;
the project supports Node 22, so 5.x until that changes. The study module
talks to it through the `ReviewScheduler` port (`initialMemory`, `preview`,
`review`); `TsFsrsScheduler` is the only file that imports the library.
Every FSRS card field is its own column in `study_states` (including
`stability_fast`, FSRS-7's extra field, kept at 0 so a later upgrade needs
no migration); each review stores the previous memory so undo is exact.

## Consequences

The domain (queue, day boundary, streak, retention) stays library-free and
exhaustively testable. A future per-user optimiser (spec 12, out of scope) can
replay the stored review log. Upgrading ts-fsrs is a one-file change plus a
check that the stored fields still map.

## Alternatives considered

`ts-fsrs` 6 with FSRS-7 (needs Node 24); `femto-fsrs`
(smaller community, no learning-step support); writing FSRS ourselves (ruled
out by spec 6).
