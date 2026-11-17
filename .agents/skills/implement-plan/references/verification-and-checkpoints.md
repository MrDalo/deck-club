# Verification and checkpoints

Read this reference before accepting a phase and again before creating its
checkpoint commit.

## Acceptance matrix

Build a one-to-one matrix from the current phase:

| Plan obligation | Implementation evidence | Verification evidence | State |
| --- | --- | --- | --- |
| change item or success criterion | file, symbol, diff, or human confirmation | exact command and result, or manual result | passed / blocked |

The matrix is complete only when every change item, automated criterion, and
manual criterion appears exactly once. Examples in the plan guide the solution;
the named behavior and success criteria determine acceptance.

## Automated proof

1. Run every command named by the phase from the intended repository and working
   directory. Capture the command and result.
2. Add focused tests or checks required by the actual touched behavior, then run
   the narrowest relevant checks before broader integration checks.
3. Review the diff against the phase, repository instructions, and existing
   conventions. Account for every changed and untracked path.
4. Run cheap repository hygiene checks supported by the environment, including
   whitespace validation and format/lint checks where configured.
5. Update automated plan checkboxes only for conditions whose evidence passed.

A skipped, unavailable, flaky, or baseline-failing check has a disposition, not
a passing mark. Manual criteria remain open until the human reports their result.

## Checkpoint staging

Create a checkpoint only after the human gate for the phase or authorized range.

1. Refresh `git status --short` and compare it with the recorded baseline.
2. Stage explicit phase-owned paths. Keep pre-existing and unrelated paths out of
   the index.
3. Exclude `.agent-work/tasks/` and its contents. Plan progress may live through
   a symlink into another repository and is not part of the code checkpoint.
4. Inspect `git diff --cached --stat` and `git diff --cached`; map every staged
   hunk back to the acceptance matrix.
5. Commit with a message describing the phase outcome, then record the hash and
   verify the post-commit status.

If phase-owned hunks overlap user-owned edits in one file, use hunk-level staging
only when the separation is unambiguous. Otherwise report the overlap and ask how
the user wants the checkpoint handled.

The checkpoint is complete when every staged hunk belongs to the approved phase,
the commit succeeds, its hash is in the phase ledger, and all non-phase work
remains untouched.
