---
name: iterate-prd
description: Refine an existing PRD through resolved product decisions and verified feedback.
disable-model-invocation: true
---

# Iterate PRD

Refine an existing Product Requirements Document without losing its decision history, requirement identity, or relationship to evidence.

Run a **decision loop**: establish the facts, resolve one product decision, repaint the affected parts of the PRD, validate the result, and return control to the user. A question, objection, or thought-in-progress continues the discussion; it becomes an edit only when the decision is settled.

Keep the work in product space: user experience, observable behavior, scope, and success. Record implementation-only questions under `Deferred to TDD` unless they expose a product decision.

## 1. Establish the working set

Resolve the task directory and PRD path from the invocation or conversation. If either is genuinely ambiguous, ask one precise question and wait.

For an `.agent-work/tasks/<task>` directory, use a symlink-following directory listing such as `ls -La`; inventorying it with a non-following glob can silently miss its contents. Read every file in the task directory completely, including the PRD, ticket or task, research, design discussion, diagrams, mockups, and later notes. Read every additional path named by the user. Preserve the PRD's path, frontmatter, and established structure.

Apply this authority order when artifacts disagree:

`active user decision > PRD > design discussion > research > ticket`

An unresolved comment is feedback to evaluate, not an authority that silently overrides the PRD.

Completion criterion: the exact PRD, every task-directory file, every user-named source, and the newest applicable decisions are accounted for.

## 2. Inventory every input

Build a private **resolution ledger** for every requested change, supplied comment, fetched artifact comment, contradiction, and open product question. Before processing comments or deciding whether feedback requires research, read [Feedback, evidence, and resolution](references/feedback-resolution.md).

If the user supplied neither feedback nor a direction, ask exactly one question offering these branches:

1. apply specific feedback;
2. continue resolving the solution one decision at a time; or
3. surface gaps in the PRD.

Then wait. If the user supplied clear instructions, continue without asking them to repeat those instructions.

Completion criterion: every input has one ledger entry with its source, target, classification, evidence need, and current disposition; no supplied or discoverable comment is omitted.

## 3. Ground claims in evidence

Treat statements of desired behavior as product decisions. Verify claims about current behavior, existing patterns, file paths, constraints, or feasibility against the named sources and codebase.

Use focused code research when a decision depends on existing functionality. Independent questions may be delegated concurrently to the available locator, analyzer, or pattern-research agents; ask each for concrete file-and-line evidence. Straightforward copy, wording, or preference feedback needs no code search.

When evidence is insufficient, keep the ledger item open and ask one blocking question or report the exact evidence gap. Completion criterion: every factual premise used to accept, reject, or reshape feedback is either directly evidenced or explicitly identified as an assumption for the user to decide.

## 4. Resolve one product decision

Choose the highest-leverage unresolved ledger item. If it is already unambiguous and authorized, mark it resolved. Otherwise:

- state one decision;
- offer two or three materially distinct options with tradeoffs;
- recommend one option from the user and product evidence; and
- end with exactly one question, then wait.

Clarifying questions and pushback remain in this loop. Update the PRD only after the user has chosen, confirmed, or supplied an unambiguous instruction. A request to apply a clearly specified set of changes resolves that set as one authorized batch; ambiguous items still return to the one-decision loop.

For a visual decision, read [Visual iteration](references/visual-iteration.md) before presenting options or editing mockups.

Completion criterion: the selected item or authorized batch has an explicit disposition and rationale; every unresolved ambiguity remains visible in the ledger rather than being guessed into the PRD.

## 5. Repaint the PRD

Edit the document at its original path. Rework the affected sections in place so the result reads as a coherent current specification, never as a Q&A transcript, comment log, or revision appendix.

Before editing requirements, acceptance criteria, scope, success measures, or dependencies, read [PRD integrity](references/prd-integrity.md). Apply every coupled update identified there. Keep implementation design in `Deferred to TDD`.

Use takeaway headings that state the section's conclusion. Keep paragraphs short and place each diagram or mockup beside the behavior it explains. Update visual artifacts and their document links when the resolved behavior changes what users see.

Completion criterion: every resolved ledger item is represented in the appropriate PRD sections; all affected requirements, acceptance criteria, scope boundaries, success measures, dependencies, rollout constraints, and visuals agree with one another.

## 6. Validate the revision

Run the exhaustive checklist in [PRD integrity](references/prd-integrity.md). Re-read the complete edited PRD and compare it with the resolution ledger and affected artifacts. Repair each failure before reporting completion.

For artifact comments, reply to or change comment status only within the user's explicit authorization, and only after the corresponding document change or evidence response is complete.

Completion criterion: every ledger item has a final or explicitly open disposition; every incorporated change is visible and internally consistent; every factual claim is supported; every changed acceptance statement is observable; every affected mockup and link resolves; and authorized comment actions match their outcomes.

## 7. Return control or hand off

After one resolved decision or authorized batch, report what changed and ask exactly one question: `What would you like to work on next?` If a specific unresolved decision is the natural next step, present that single decision with options and a recommendation instead. Wait for the user's answer.

When the user says the PRD is done, or exhaustive validation shows that no material product decision remains, read [PRD handoff](references/prd_final_answer_resolved.md). Select the permalink or local-path branch, substitute only the indicated value, and return that template without an added summary.

Completion criterion: an in-progress run ends at one clear user decision point; a completed run ends with exactly one applicable handoff template.
