---
name: iterate-research-questions
description: Revise an existing research-question set while preserving its scope, evidence trail, numbering, and history.
disable-model-invocation: true
---

# Iterate Research Questions

Revise the active research-question artifact in place. The artifact remains a query plan for learning how the codebase works today; this skill does not answer the questions or design the requested change.

## 1. Resolve the artifact and every revision input

Use an explicit research-question file path when the user supplies one. When only a task identifier is known, resolve its artifact directory under `.agent-work/tasks/<task-id>/`. When the input is a task directory, or the task directory is available from session context, run `ls -La -- <task-directory>` so symlinked directories are followed and inspect the listing for research-question documents. Select the sole match. If there are several plausible matches, ask the user to choose before reading them; if there are none, ask for the artifact path.

Read the selected artifact in full, including frontmatter, question numbers, context pointers, retired questions, and revision history. Then inventory all applicable revision inputs:

- feedback in the invocation or conversation;
- supplied `<comments>...</comments>` blocks, preserving comment IDs and reply order;
- artifact comments fetched through the host when the user asked to apply or review them;
- ticket, task, or collateral files the user explicitly named as feedback sources; and
- changed repository or external evidence the user explicitly called out.

Treat each user-authored comment or reply as a separate input. Read no sibling task artifacts merely because they share the directory. If the user supplied neither revision instructions nor actionable comments, ask what they want changed and stop.

Separate comment-content authority from comment-state authority. “Review” or
“inspect” authorizes analysis only; it does not authorize editing the artifact,
replying, resolving, reopening, deleting, or restoring. Each of those actions
requires an explicit request.

This step is complete when exactly one artifact is selected and every authorized feedback source has been read in full.

## 2. Build a feedback ledger

Atomize the inputs into a private ledger. For each item record its source or comment ID, the affected question or section, any evidence needed, and one class:

- **correction** — an existing premise or formulation may be wrong;
- **new uncertainty** — the query plan is missing something material;
- **reprioritization** — investigation order or emphasis changes;
- **scope change** — the boundary of what must be understood changes;
- **retirement** — a question is answered, irrelevant, or superseded; or
- **context pointer** — a link, repository, dependency, package, filepath, or directory must be preserved or added.

Give every item a disposition: inspect only, apply, already satisfied, defer with reason, or clarify. For each comment, also record any separately authorized reply or state mutation. Preserve disagreements between comments instead of silently choosing a side. When a conflict or ambiguity would materially change scope, ask one focused question and stop before editing.

If comments were supplied for review but no content action was authorized,
report the proposed dispositions, ask whether to apply any of them, and stop
before Steps 3–5. Do not create a revision-log entry or mutate comment state.

This step is complete when every atomic input has exactly one disposition and every material ambiguity is either resolved or awaiting an explicit user answer.

## 3. Recheck affected evidence

Reinspect the repository or named source for every correction, questioned premise, newly claimed uncertainty, evidence-driven reprioritization, and scope change. Capture concrete paths, symbols, commands, issue links, or documentation URLs; label inference as inference. Keep the check lightweight: stop when there is enough current evidence to phrase and bound the question, not when the research question itself has been answered exhaustively.

When evidence answers an existing question, retire it with the evidence and reason. When evidence remains unavailable or contradictory, keep the uncertainty visible in the question or ask the user when it blocks a faithful revision.

This step is complete when each ledger item that depends on facts has either a current evidence basis or an explicit unresolved-evidence disposition.

## 4. Design the revised query plan

Apply the following contract to every active question:

- It asks what exists, where it exists, how it behaves, or how components interact in the current system.
- It has one dominant uncertainty, names a productive starting point when one is known, and states what evidence would be sufficient to stop investigating.
- It is high-level enough to permit end-to-end discovery while still bounded enough to answer.
- It covers implementation details, architecture, dependencies, contracts, patterns, constraints, or edge cases only where they bear on the task's current-state understanding.
- It uses descriptive framing such as “How does … work?” or “Trace … from … through …”. Normative prompts about what to build, change, improve, or choose are outside the question list.

Order attention by information value: prerequisites and questions that constrain several others are highest priority, followed by component details and edge cases. Preserve the artifact's existing priority notation. If feedback explicitly changes priority and the artifact has no notation, add a minimal `Priority: high|medium|low` line to the affected questions rather than renumbering them.

For frontend or visual-component work, include coverage of the current design system: the component library, theming, colors with hex values, typography, spacing, borders, and shadows. This question may remain general to the relevant product area.

Aim for 3–8 active questions, scaled to task complexity. An explicit user count wins. An inherited set outside that range is not a reason to erase useful questions; merge genuine duplicates or record why the larger set remains.

This step is complete when every planned active question satisfies the contract, collectively covers the revised scope, and has an evidence-bound stopping point.

## 5. Revise in place without erasing history

Edit the selected artifact at the same path. Preserve its YAML frontmatter, heading style, and established question syntax unless the feedback explicitly changes them.

- Keep each existing question's number or identifier through wording and priority changes.
- Assign each new question the next unused number; retired numbers are never reused.
- Move answered, irrelevant, or superseded questions to an existing retirement section, or create `## Retired Questions`. Retain the original number and wording, then append the retirement date, reason, and supporting evidence.
- Preserve every existing **Key Context Pointers** entry verbatim. Add newly supplied pointers verbatim and organize them without rewriting URLs, package names, repositories, or paths.
- Add one entry to `## Revision log` (create the section if absent) with the date, feedback sources or comment IDs, material dispositions, evidence rechecked, and any scope or priority change. Refer to question numbers rather than copying question text.

Artifact comment state is separate from document content. Reply to, resolve, reopen, delete, or restore comments only when the user explicitly requested that exact action and the required host tool is available. Reinspect each mutated thread and block completion if its observed state does not match the request.

If every feedback item is already satisfied and evidence shows no semantic edit is needed, leave the artifact byte-for-byte unchanged and skip the revision-log entry.

This step is complete when every applied ledger item is visible in the artifact, every non-applied item has a reason, and no question identity or context pointer has disappeared silently.

## 6. Validate the whole artifact

Reread the final file in full and verify every check:

- frontmatter is valid YAML and preserves the original metadata;
- every feedback item still has its intended disposition;
- active question identifiers are unique and stable, new identifiers are monotonic, and retired identifiers remain traceable;
- each active question is current-state, non-normative, scoped, prioritized where required, and contains an investigation route plus a checkable stop condition;
- active questions contain no duplicate uncertainty, contradiction, already-settled premise, or leaked implementation proposal;
- the active set covers the revised scope, including design-system coverage when the frontend branch applies;
- **Key Context Pointers** retains every prior pointer verbatim and includes every new pointer supplied by feedback;
- retirement reasons and the revision-log entry agree with the edited questions and cited evidence;
- Markdown structure is intact and every local link resolves; and
- any available repository validator for skill or artifact Markdown passes.

Repair failures and repeat the full validation. Classify the result as
**updated**, **already satisfied**, or **blocked**. A blocked result retains the
artifact for inspection but is not complete.

## 7. Hand off

After validation, read [the research-question handoff](references/research_questions_final_answer.md) and return exactly the branch matching the classified result. Use an optional host-provided artifact permalink when one is available; otherwise use the artifact path. A blocked branch must name every unresolved validation item and must not offer `$create-research`. Do not append research answers, implementation advice, or a separate summary.
