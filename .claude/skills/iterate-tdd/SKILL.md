---
name: iterate-tdd
description: Refine an existing technical design one verified decision at a time.
disable-model-invocation: true
---

# Iterate TDD

Keep an existing Technical Design Document (TDD) aligned with the latest decisions and repository reality. Work in lockstep with the user: resolve one design decision, repaint the affected design, report it, and stop.

## Operating contract

- Ask exactly one question per message. A choice among two or three options is one question; independent decisions are separate turns.
- Treat pushback, thinking aloud, and questions from the user as discussion. A decision is resolved only when the user accepts a direction or the evidence makes the disposition explicit.
- Edit only after resolution. Repaint the affected section into a coherent design; keep feedback threads, decision logs, and patch chronology out of the design narrative.
- Verify claims about existing behavior, files, interfaces, or conventions before using them. User feedback is an input, not automatically repository fact.
- Keep System Design and Program Design distinct, then reconcile their shared names, boundaries, contracts, and flows.
- After one incorporated decision or one answered question, stop for user direction.

## Entry branch

If the invocation contains no feedback, comment set, or requested direction, send this and stop:

```text
How should we continue the technical design: apply a concrete change, examine
one unresolved decision in depth, or identify the next missing design question?
```

Otherwise classify the turn as direct feedback, artifact comments, continued grilling, or completion. Follow only that branch through the runbook.

## Runbook

### 1. Establish the complete working set

Identify the task directory from the invocation or conversation. If it remains ambiguous, ask one question for the exact task or TDD path and stop.

For `.agent-work/tasks/<task>/`, use `ls -La` on the exact directory because it may be a symlink; enumerate that task directory without recursive glob or grep traversal. Read every file in it in full, including the current TDD and any ticket/task, research, design discussion, PRD, mockup, implementation note, or earlier artifact. Read every path or source named in the feedback in full as well.

Before processing feedback or comments, read [Feedback intake and resolution](references/feedback-and-resolution.md). It defines the exhaustive source inventory, artifact-comment retrieval branch, separate design/comment states, and the one-decision resolution loop.

This step is complete when every available input is represented in the feedback inventory, the current TDD is identified, and missing or inaccessible inputs are named.

### 2. Verify the active item

Select the one open item that blocks the most downstream design work. When it asserts repository behavior, requests detail about existing functionality, or depends on an implementation pattern, read [Code research and evidence](references/code-research.md) before proposing or editing anything.

Trace the item to every potentially affected surface: component boundary, data/control flow, public contract, persistence/schema, failure behavior, program structure, product behavior, verification, migration, rollout, and backout. Mark a surface not applicable only after checking it.

This step is complete when the active item is supported by cited evidence, established as a product/design choice, or explicitly blocked on one missing fact.

### 3. Resolve exactly one decision

For direct feedback, test the requested correction against the evidence and discuss any conflict. For artifact comments, preserve the comment thread's identity and state while resolving its design claim. For continued grilling, find the next unresolved or sparse part of System Design or Program Design without expecting a prewritten question list.

When a decision is still open:

1. State one concrete question.
2. Offer two or three materially different options and their tradeoffs.
3. Recommend one option from repository evidence and upstream requirements.
4. Show system-design choices as a focused Mermaid diagram, high-level type, schema, or RPC/API signature; show program-design choices as a call-stack tree, component tree, file-tree diff, dependency-injection map, or method signature.
5. Stop and wait.

Answer clarifying questions without editing. Continue the same decision on the next turn until it reaches an explicit disposition.

This step is complete when the item is accepted, accepted with an evidence-backed adjustment, rejected, superseded, or blocked—or when the single question has been sent and the turn has ended.

### 4. Repaint the resolved decision

Before editing, read [TDD design and visual language](references/design-and-visuals.md). It defines document precedence, System Design versus Program Design, selective diagrams and code-shape views, product-document propagation, consistency checks, and Markdown fencing.

Edit the TDD at its original path. Preserve its YAML frontmatter and every
metadata value unless the user explicitly authorized a metadata correction.
Rewrite the smallest complete affected section so it reads as intentional
current design, not appended feedback. Update adjacent prose, diagrams,
signatures, examples, and cross-references whenever the changed decision
invalidates them.

If the decision changes product scope or UX, update the PRD and/or mockup in the same turn. If Mermaid or plain text cannot communicate the decision clearly, take the HTML branch: read [the artifact template](references/artifact_template.html), copy its complete `<style>` block into `.agent-work/tasks/<task>/diagram-<description>.html`, add focused realistic content, and link it beside the TDD section it explains. If the current host supports inline previews, it may additionally preview that same file.

For artifact comments, change comment state or post a reply only when the user authorized that action. Design incorporation and comment resolution are separate outcomes.

This step is complete when the resolved choice is woven into every affected document and visual, with no question log or stale alternative left in the current-design prose.

### 5. Run the coherence gate

Audit every surface marked affected in step 2. Confirm:

- System Design and Program Design describe the same boundaries, names, contracts, data, and control flow.
- Diagrams, code shapes, file paths, and examples agree with the prose and verified repository patterns.
- Failure handling, compatibility, migration, rollout/backout, and verification reflect the revised risks; unchanged areas are deliberately unchanged.
- PRD/mockup behavior agrees with the TDD where the technical choice affected product behavior.
- Open items remain visibly unresolved rather than being written as decisions.
- The precedence rule `TDD > PRD > design discussion > research > ticket/task` explains any surviving conflict.
- The file remains at its original path, its YAML parses, and its metadata is
  unchanged except for explicitly authorized corrections.
- Every explicitly requested comment reply or state mutation was attempted in
  thread order, re-read afterward, and reached the requested observable state;
  unrequested comment state is unchanged.

This step is complete when every affected surface passes or is explicitly recorded as an open blocker. Do not declare the design complete with an unaccounted contradiction.

### 6. Stop or complete

After one incorporated decision, report the changed section and its local path or optional artifact permalink. Ask one specific next-step question, naming the next unresolved decision when one exists, and stop.

When research or an authorized comment operation is blocked, name the missing
evidence or failed thread action, state what remains unchanged, ask one question
that can unblock it, and stop. A successful design edit does not hide a failed
comment operation.

Only when the coherence gate finds the design fully resolved—whether the user said they are done or the design naturally reached closure—read [the resolved TDD handoff](references/tdd_final_answer_resolved.md) and follow it exactly. Add no preamble or trailing summary. Use an artifact permalink when the environment provides one; otherwise substitute the local TDD path.

## Output contract

Every turn ends in exactly one of these observable states:

- **Awaiting direction:** the initial three-choice prompt was sent.
- **Awaiting decision:** one question with options, tradeoffs, recommendation, and the appropriate visual was sent; no document changed.
- **Blocked:** one missing-evidence or failed-comment-action question was sent; no unsupported design change was made, and any completed edit is identified accurately.
- **Incorporated:** one resolved decision was repainted, all affected surfaces and authorized comment operations passed the coherence gate, and one next-step question was sent.
- **Complete:** no unresolved design item, contradiction, or failed authorized comment action remains, and the resolved handoff template was used exactly.
