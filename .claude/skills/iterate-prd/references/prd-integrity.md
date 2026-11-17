# PRD integrity

Use this reference before edits that affect requirements, acceptance, scope, success, dependencies, or rollout, and again for final validation.

## Preserve requirement identity

When the PRD uses stable requirement or acceptance identifiers:

- retain an identifier while the requirement's user-visible intent remains recognizable;
- revise its statement and acceptance criteria together;
- allocate a new identifier for genuinely new behavior;
- retire or mark removed requirements according to the document's convention; and
- preserve historical references by keeping identifiers stable rather than renumbering survivors.

When the PRD has no identifier scheme, preserve its format instead of introducing one solely for this iteration. Track affected sections in the private resolution ledger.

## Apply coupled updates

For each resolved change, inspect every coupled surface:

- problem and affected user;
- proposed solution and detailed behavior;
- requirement and observable acceptance criteria;
- defaults, permissions, errors, empty states, and boundary behavior;
- in-scope and out-of-scope statements;
- alternatives and rationale when the chosen direction changed;
- success signal or the explicit agreement that no useful signal exists;
- dependencies, rollout, compatibility, and operational constraints when product-visible;
- mockups, diagrams, captions, and embedded artifact paths; and
- `Deferred to TDD` items created or invalidated by the decision.

Success is a decision lever. Choose a product metric, adoption signal, benchmark, reliability or latency target, or qualitative check that can distinguish success from failure. For a small change with no meaningful signal, record that conclusion only with the user's agreement.

Acceptance criteria describe observable outcomes and boundaries. They agree with scope and avoid dictating storage, schemas, or internal architecture unless the implementation detail itself is a product constraint.

## Repaint the document

Integrate each decision into the sections a new reader would expect. Replace superseded statements, reconcile duplicated explanations, and use takeaway headings that expose the document's conclusions when skimmed. Keep rationale with the decision it explains. Place each visual beside its related behavior.

The finished PRD describes the current product contract. The private ledger carries processing history.

## Exhaustive validation

Re-read the full PRD and verify every check:

- Every ledger input maps to one visible edit or one explicit non-edit disposition.
- Every retained requirement identifier still denotes recognizably the same intent.
- Every new or retired behavior has the appropriate identity treatment.
- Every changed requirement has observable acceptance criteria, including relevant failure and boundary behavior.
- Problem, solution, details, acceptance, scope, and success contain no contradictions.
- New scope is present in the solution; excluded scope is explicit; removed scope leaves no stale promises.
- Dependencies, rollout constraints, alternatives, and TDD deferrals reflect the changed decision.
- Factual claims about the existing product or code match the gathered evidence.
- Takeaway headings, paragraphs, diagrams, and mockups form a skimmable human document.
- Every visual shows the winning state with realistic labels and its embedded path resolves.
- Frontmatter and unrelated document structure remain intact.
- Every modified local link and artifact path resolves.
- Every authorized comment reply or status change matches that comment's actual disposition.
- No unresolved discussion was written as a settled requirement.

Completion requires every check to pass or an explicit open item returned to the user as the next single decision.
