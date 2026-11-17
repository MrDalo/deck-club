---
name: iterate-design-discussion
description: Revise an existing design discussion while preserving evidence and decision state.
disable-model-invocation: true
---

# Iterate a design discussion

Revise the existing design discussion in place. Preserve its decision trail,
ground factual changes in evidence, and leave every design question in an
accurate open or resolved state.

## 1. Establish the revision

Identify both the design-discussion artifact and the revision input. Input may
be direct feedback, an approval or rejection, referenced files, or artifact
comments.

If the user supplied no feedback or comments, ask:

> Which part of the existing design discussion should we revise, and what
> outcome should the revision produce?

Then stop and wait. If the task directory or artifact cannot be identified
from the request and conversation, ask for its path and wait.

This step is complete only when one existing design-discussion path and at
least one actionable revision input are identified.

## 2. Load the complete record

Use `ls -La .agent-work/tasks/TASKNAME` to inventory the task directory; it may
be a symlink. Open the listed paths directly because search and glob operations
may not traverse that symlink. Read every file in the directory in full,
including the current design discussion, ticket or task, research, and any
later artifacts. Fully inspect every additional file or directory the user
names.

Use this precedence when sources disagree:

**design discussion > research > ticket or task**

The design discussion contains decisions made after the earlier artifacts.
Treat later artifacts as evidence of subsequent work, not as silent authority
to rewrite a design decision. Surface any conflict that the user's feedback
does not resolve.

This step is complete only when every task artifact and mentioned source has
been read, the discussion's original path is known, and every contradiction
relevant to the revision has been recorded.

## 3. Build a revision ledger

Create an internal ledger with one row per instruction, decision, factual
claim, and comment thread. For each row record its target, required evidence,
and one disposition: apply, reject with reason, ask a focused question, or
leave open pending evidence.

Distinguish design authority from factual authority:

- A clear user choice, approval, or rejection decides a design question.
- A claim about current behavior, integration, or code conventions requires
  verification before it changes the artifact.
- Ambiguous feedback that would materially change the architecture requires a
  focused clarification. Continue with independent, unblocked rows.

For artifact comments:

- When comment bodies are supplied, treat each thread as a separate ledger
  row and give later replies in that thread their chronological meaning.
- When comments are referenced but absent, fetch them with an available
  artifact-comment reader. If comment capabilities are unavailable, ask the
  user to supply the comments or reopen the work where the artifact is
  accessible.
- When the user has not selected a comment action, ask whether they want the
  document updated only, updated and satisfied comments resolved, or findings
  posted as replies. Comment replies, resolution, and deletion require the
  user's explicit choice.

This step is complete only when every input and comment thread has exactly one
disposition and any external comment mutation has explicit authorization.

## 4. Verify changed facts

Investigate every ledger row whose correctness depends on the repository.
Start with the user's cited locations. Trace relevant implementation,
integration points, callers, tests, and established analogues far enough to
support or disprove the proposed edit.

For independent unknowns, delegate focused research in parallel when those
helpers are available:

- `codebase-locator` finds owning files and related components.
- `codebase-analyzer` explains behavior and integration details.
- `codebase-pattern-finder` finds conventions, comparable implementations,
  and tests worth following.

Give each helper one bounded question and require file-and-line evidence.
Treat its report as a map: inspect the cited primary code before placing a
claim or snippet in the artifact. When the input asks how existing
functionality works or requests deeper implementation detail, begin with one
or more focused helpers before main-context verification. Straightforward
wording edits and explicit design choices need no delegated research when the
loaded record is enough.

This step is complete only when every factual row has primary evidence, every
code pointer has been checked, and remaining uncertainty is represented as an
open question rather than stated as fact.

## 5. Reconcile the discussion

When at least one ledger row applies, edit the design discussion at its
original path. When none applies, leave the file unchanged and carry each
reason into the handoff. In either case, reconcile the document's internal
consistency:

- Update the current state, desired end state, non-goals, and proposed
  architecture wherever the revision changes them. Use before/after diagrams,
  concise pseudocode, or examples when they remove architectural ambiguity.
- For each major design choice, keep viable options comparable with concrete
  tradeoffs and a recommendation grounded in evidence and repository
  conventions.
- A clear user decision moves its question from `Design Questions` to
  `Resolved Design Questions`. Record the chosen option, rationale, and the
  material alternatives rejected with reasons.
- An unanswered or newly exposed tradeoff remains under `Design Questions`,
  even when one option is recommended. Only user feedback resolves it.
- A changed decision replaces the operative answer while preserving enough of
  the prior decision and new rationale to explain the reversal.
- Refresh `Patterns to follow` with verified paths and concise multiline code
  examples. Remove patterns disproved by the new evidence.

When the document itself contains Markdown examples with fenced code, use a
four-backtick outer fence so nested three-backtick fences remain valid.

This step is complete only when every ledger row is reflected, explicitly
rejected, or visibly blocked; every major choice has a rationale; all question
states match the user's decisions; and all sections agree on one architecture.

## 6. Validate the saved artifact

Re-read the saved file in full and check all of the following:

- It remains at the original path and retains valid artifact metadata.
- Every requested change and relevant source conflict has a disposition.
- Current state, desired state, non-goals, architecture, decisions, and
  patterns agree with one another.
- Each open question asks for a real user decision; each resolved question has
  an explicit user answer and rationale.
- Referenced paths exist, quoted code matches the repository, diagrams and
  fences render, and no unverified claim is presented as settled.

If comment mutation was authorized, perform it only after the artifact passes
these checks. Use the available reply capability for requested findings and
the comment-state capability for the authorized state change. Resolve only
threads whose requested change is satisfied, and reconcile every requested
operation by comment ID. Capture an artifact permalink when the read or edit
operation returns one.

This step is complete only when every check passes, every authorized comment
operation is accounted for, and the final path and any returned permalink are
known.

## 7. Hand off the result

Select exactly one final-answer branch after validation:

- If any design question or evidence gap remains open, or any feedback/comment
  was not applied, read
  [the unresolved handoff](references/design_discussion_final_answer.md) and
  follow it.
- If the document has no open design questions, every resolved question records
  an explicit user decision, and no feedback or evidence gap remains, read
  [the resolved handoff](references/design_discussion_final_answer_resolved.md)
  and follow it.

This step is complete only when the handoff links the artifact using a returned
permalink when available and always gives its local path, reports every
remaining open or unapplied item in the unresolved branch, and gives the
structure-outline skill only in the resolved branch.
