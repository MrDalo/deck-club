---
name: create-prd
description: Create a product requirements document through a guided product interview.
disable-model-invocation: true
---

# Create a PRD

Turn the available idea, ticket, research, or pain point into a Product Requirements Document that defines **what** the product should do and **why** it matters. Keep implementation design for the downstream TDD.

Treat the PRD as a **living spec**: after each resolved decision, rework the affected prose and visuals so the document describes the current product coherently. It must never read like interview notes, a decision log, or a transcript.

## Interview protocol

These rules govern the foundation and solution interviews:

- Ask exactly one product question per interview message. A choice among two or three options is one question; multiple independent decisions are not.
- Ask the highest-leverage unresolved question, explain the options and tradeoffs, give a recommendation, then wait. Make it a concrete decision, never a vague request for feedback.
- Keep one decision open until it is resolved. If the user pushes back, thinks aloud, or asks a clarifying question, answer within that decision and leave the PRD unchanged.
- Flush a decision only after it is settled. Rewrite every affected section in one pass; reorder or remove stale material instead of appending an answer.
- Keep questions in product space: user experience, functionality, behavior, and success. Put implementation choices such as schemas, storage, or architecture under **Deferred to TDD**.
- Use takeaway headings that state the conclusion, short paragraphs, and visuals beside the claims they explain.

The interview protocol is satisfied only when each interview response contains one decision and one question, and each document edit represents a resolved decision consistently everywhere it applies. The final handoff is not an interview message and follows its referenced template instead.

## 1. Ground the work

Resolve the task directory from the invocation and inspect it with `ls -La .agent-work/tasks/<task>`; the entry may be a symlink. If the invocation contains only a problem statement, derive a stable two-to-five-word kebab-case task slug from its central product problem and use `.agent-work/tasks/<slug>/`. Reuse that exact directory when it exists; otherwise create it. If a safe, meaningful slug cannot be derived, ask for the task name and stop before writing. Read every relevant file in the resolved directory in full, except research-question documents. There is no required upstream artifact: work from a detailed ticket, a research document, or the user's prompt—whatever exists.

Before drafting, read [`references/prd_template.md`](references/prd_template.md) in full. It is the field and section contract for the completed PRD.

Ground claims in the available inputs and cite those inputs naturally (for example, “Per the ticket…”). Refer to upstream material instead of copying it into the PRD. Turn missing product context into interview questions rather than invented requirements.

When a product decision depends on current code, established product patterns, a design system, a library, or external facts, read [`references/research-and-visuals.md`](references/research-and-visuals.md) and complete its evidence branch before presenting options.

This step is complete when the exact task directory is resolved, every relevant non-research-question input has been read fully, the template has been read, known facts are traceable to their sources, and every material unknown is queued as a product question rather than filled by assumption.

## 2. Create the minimal skeleton

Create `.agent-work/tasks/<task>/NN-prd-DESCRIPTION.md`, where `NN` is the next zero-padded index in the task directory and `DESCRIPTION` is a two-to-four-word kebab-case slug.

Write only:

- the template frontmatter with `type: design-prd` and real task, repository, branch, and HEAD SHA values;
- the title;
- **Problem to Solve**, containing a concise first draft grounded in the inputs;
- blank placeholders for the template's success-measure, proposed-solution, and solution-details sections, preserving their exact template headings.

Do not add a preamble, setup narrative, summary, alternatives, or speculative detail yet. Immediately tell the user the exact saved artifact path, then open the foundation interview with at most one orienting sentence and one question asking whether **Problem to Solve** is right. Quote the section's actual text so the user reviews the document, not a paraphrase.

When markdown must demonstrate a fenced block, use a four-backtick outer fence around the three-backtick example.

This step is complete when the file has the next valid index, every frontmatter value is concrete, the skeleton contains only the allowed initial sections, and the response quotes the exact problem statement and ends with one question about it.

## 3. Settle the foundation

Resolve the foundation in order, waiting for the user at each gate.

1. **Problem to Solve.** Iterate on the problem statement until the user confirms it. Then rewrite the section around the agreed problem.
2. **What success looks like.** Propose one recommended success lever or a small set of meaningfully different options. Fit it to the work: it may be a product metric, adoption signal, benchmark, reliability or latency target, or qualitative read. Include experiments or feature flags when relevant. If a very small change has no honest measure, explain that and record “no meaningful measure” only with the user's agreement.

Treat the success lever as part of the product definition of done. Open the solution interview only after the user has settled both foundation sections.

This step is complete when the user has explicitly accepted the problem statement and the success section, both sections have been rewritten into cohesive document prose, and no foundation question remains unresolved.

## 4. Walk the solution tree

Interview one product decision at a time. For each decision:

1. Present the decision, two or three genuinely distinct options when useful, their tradeoffs, and your recommendation.
2. Continue the same decision loop through clarification and pushback without editing the PRD.
3. Once resolved, rework **Solution Details** and every other affected section so the living spec absorbs the choice.
4. Let that resolution determine the next highest-leverage decision.

Maintain the completed template as the solution emerges:

- Keep **Proposed Solution** as the high-level chosen approach.
- Put credible rejected approaches and their rationale in **Alternative Solutions Considered**.
- Describe the chosen experience and behavior in **Solution Details** using takeaway headings.
- Put explicit product exclusions in **Out of Scope**.
- Put implementation-only choices in **Deferred to TDD**.

When a decision is visual, or a visual would communicate it more precisely than prose, follow the mockup branch in [`references/research-and-visuals.md`](references/research-and-visuals.md). Pause the question flow while the user requests mockup changes; resume only after the mockup is approved. Keep every embedded winning mockup synchronized with the prose.

This step is complete when every material product decision exposed by the inputs and interview is resolved, explicitly out of scope, or deferred to TDD; the chosen flow and its meaningful states are described; all affected sections agree; and every retained visual shows the current approved behavior.

## 5. Run the whole-solution gate

Tell the user the solution is complete enough for a whole-document review and ask exactly one question: have them read **Solution Details** from top to bottom and confirm that it hangs together. Wait for explicit approval. Treat requested changes as reopened decisions, incorporate them through the same interview protocol, and repeat the gate when they materially change the solution.

This step is complete when the user has explicitly approved the complete Solution Details after its latest material revision and no product issue raised during review remains open.

## 6. Audit and hand off

Read the finished PRD in full and audit it against [`references/prd_template.md`](references/prd_template.md):

- frontmatter values are concrete and correct;
- the problem, success measure, chosen solution, alternatives, details, and scope agree;
- headings communicate takeaways and the body reads as a spec rather than a conversation;
- upstream evidence is referenced without needless duplication;
- implementation detail appears only where product behavior requires it or under **Deferred to TDD**;
- mockups and diagrams are current, adjacent to the behavior they explain, and use valid artifact paths.

Repair every failed check, repeating the whole-solution gate if a repair changes product meaning. Then read [`references/prd_final_answer_resolved.md`](references/prd_final_answer_resolved.md) and follow it exactly. Include an artifact permalink when one is available.

This workflow is complete only when every audit item passes, the approved PRD is saved at the promised path, and the final response uses the handoff template to point to both the artifact and the TDD phase.
