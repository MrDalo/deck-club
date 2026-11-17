---
name: create-tdd
description: Create an implementation-ready technical design through a guided system and program design interview.
disable-model-invocation: true
---

# Create a Technical Design

Turn the available product context into a Technical Design Document (TDD) that explains **how** the change will be built. Product intent, requirements, and UX remain authoritative in their source artifacts; cite them instead of copying them into the TDD.

The design has two ordered gates:

1. **System Design** settles behavior across components.
2. **Program Design** settles the code shape inside those components.

The user must approve the first gate before the second begins and approve the second before handoff.

## Interview contract

While either design phase or review gate is active:

- Resolve one decision at a time. End each response with exactly one decision question. Two or three alternatives inside that question are still one decision.
- Present concrete alternatives, their tradeoffs, and a recommendation grounded in the product artifacts and implementation evidence. Answer clarifying questions without treating them as approval.
- Write only settled decisions. Discussion, pushback, and partial answers leave the TDD unchanged; explicit agreement or an unambiguous choice permits a rewrite.
- Repaint the affected section after each settled decision. Restructure prose and redraw nearby diagrams or code sketches so the TDD remains a current design, never an interview transcript or decision log.
- Prefer the smallest diagram, contract, or code-shape view that exposes the decision. Use takeaway headings, short supporting prose, and place each visual beside the text it supports.

When a decision depends on code or external behavior, inspect it before offering choices. Delegate focused codebase, pattern, library, or web research when that produces stronger evidence; record durable findings in an existing research artifact when one exists.

## 1. Establish the design ground truth

Locate the task directory with `ls -La .agent-work/tasks/<task-name>` so a symlinked task is handled correctly. If the invocation contains only a short problem statement, derive a stable two-to-five-word kebab-case task slug from the central technical problem and use `.agent-work/tasks/<slug>/`. Reuse that exact directory when it exists; otherwise create it. If no safe, meaningful slug can be derived, ask for the task name and stop before writing. Read every relevant artifact in the resolved directory in full, excluding research-question documents. There is no required precursor: the available source may be a PRD, ticket, design discussion, research report, or a short problem statement.

Read [`references/tdd_template.md`](references/tdd_template.md) in full. Inspect the current implementation far enough to identify the affected entry points, component boundaries, persisted data, external dependencies, and reusable patterns with file or symbol evidence.

Treat missing product information as an interview decision. A technical choice that changes scope or UX must be called out; when an authoritative PRD or mockup exists, update that source after the user settles the change.

**Complete when:** the task directory is resolved; every relevant source artifact is read; current behavior and affected boundaries have evidence; and every gap that could change the design is either answered by a source or queued as a decision.

## 2. Create the minimal TDD

Create `.agent-work/tasks/<task-name>/<NN>-tdd-<description>.md`, where `<NN>` is the next unused zero-padded index and `<description>` is a two-to-four-word kebab-case slug. Fill the template metadata from the current repository, branch, and `git rev-parse HEAD`.

Start with only the frontmatter, title, empty `System Design` and `Program Design` sections, and `Patterns to Follow`. Add `What We're Not Doing` later only when a settled decision establishes a meaningful technical exclusion. Do not seed the document with assumptions or duplicate upstream summaries.

Immediately open the System Design interview with at most one orienting sentence followed by the first decision, alternatives, tradeoffs, and recommendation.

**Complete when:** the new file has parseable YAML with `type: design-tdd`, the required empty sections occur once in the intended order, its filename uses the next index, and the response ends with one evidence-backed system decision question.

## 3. Settle System Design

Before asking system questions, read [`references/system-design.md`](references/system-design.md) in full and use its coverage checklist and representation rules.

Walk the system decision tree in dependency order. For each decision, run the interview contract until it is settled, then rewrite the System Design to absorb it and continue with the next highest-leverage decision. Keep current behavior and the target delta together so a reader can trace how the system changes.

**Complete when:** every applicable system-design concern in the reference is resolved and represented, every inapplicable concern has been consciously ruled out, all cross-component inputs can be traced through changed boundaries and failure paths, and no unresolved system choice is disguised as prose.

## 4. Gate System Design

Ask the user to read the complete System Design top to bottom and approve it as a whole. Apply requested changes through the same one-decision interview loop, then request approval again.

**Complete when:** the user explicitly approves the coherent System Design after its latest change. Program Design remains untouched until this criterion is met.

## 5. Settle Program Design

After System Design approval, read [`references/program-design.md`](references/program-design.md) in full and use its coverage checklist and code-shape views.

Walk the program decision tree in dependency order. Almost every question should show code: render each alternative in its own code block using the repository's language and conventions. After a decision settles, rewrite the Program Design and any affected System Design contract so both describe one design.

**Complete when:** every applicable program-design concern in the reference is resolved and represented, each changed system boundary maps to concrete code ownership and control flow, codebase patterns are cited under `Patterns to Follow`, and another engineer can explain the intended code shape without inventing a design decision.

## 6. Gate and validate the complete design

Ask the user to review the complete Program Design and approve its code shape. Apply requested changes through the interview loop and request approval again. Once approved, audit the complete TDD and every linked HTML artifact.

The audit passes only when:

- frontmatter values are filled and YAML parses;
- the System and Program sections agree, use takeaway headings, and contain no placeholders or interview residue;
- every accepted source requirement and material risk is addressed by a design choice, an explicit technical exclusion, or a clearly owned follow-up;
- interfaces, paths, symbols, and cited patterns agree with inspected evidence;
- relevant failure, compatibility, migration, rollout, security, observability, and verification implications are concrete;
- each HTML artifact follows [`references/artifact_template.html`](references/artifact_template.html), renders valid structure, stays focused on one complex concept, and is linked beside the decision it explains;
- the TDD remains a high-leverage design rather than an exhaustive implementation file list, which belongs in the structure outline.

**Complete when:** the user has explicitly approved the latest Program Design and every audit item passes or names a visible, owned follow-up in the TDD.

## 7. Hand off

Read [`references/tdd_final_answer_resolved.md`](references/tdd_final_answer_resolved.md) only after both approvals and the final audit. Follow its matching host-permalink branch exactly and point to `$create-structure-outline` as the next workflow stage.

**Complete when:** the final response links the approved TDD, gives the structure-outline invocation, offers continued design investigation, and includes a host-provided permalink only when one actually exists.
