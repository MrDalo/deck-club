---
name: create-structure-outline
description: Create a phased implementation structure outline from completed task artifacts.
disable-model-invocation: true
---

# Create a structure outline

Turn completed research and design decisions into an implementation outline. The outline is an architectural map: it shows target shapes, ownership, sequencing, and proof, while leaving function bodies and task execution to the implementation phase.

This skill is user-invoked. Produce or revise the outline; implementation begins only through a later skill.

## 1. Resolve the evidence set

Read [source-discovery.md](references/source-discovery.md) before choosing inputs. Resolve the task directory, enumerate it safely, read every applicable artifact in full, and follow its citations into the repository where needed. Completed research is evidence; a research-questions document is only an earlier prompt and is excluded.

**Complete when:** an evidence ledger names every applicable artifact, every excluded research-questions file, every repository file inspected, and the precedence used for each conflict. If no task or input can be resolved, ask the user for the artifact path and stop.

## 2. Close consequential evidence gaps

Read [follow-up-research.md](references/follow-up-research.md). Investigate only gaps that could change a phase boundary, contract, ownership decision, dependency, or validation method. Use foreground subagents when available and inspect their evidence before relying on it.

**Complete when:** every consequential planning claim is supported by an input artifact or inspected source, and every remaining uncertainty is explicitly listed as an open question with its effect on the plan.

## 3. Design independently verifiable phases

Build thin vertical slices in dependency order. Each phase should deliver a coherent behavior across the layers it needs and be verifiable without a later phase. Cross module, service, or layer boundaries where the behavior naturally crosses them. A horizontal foundation phase is acceptable only when it produces a usable, testable capability or is an unavoidable migration boundary.

For every phase, establish:

- the user- or system-visible outcome;
- the relevant ownership and target shapes;
- contracts or migrations introduced or changed;
- tests added or changed alongside behavior where the repository has a relevant test seam;
- runnable automated verification; and
- manual verification only where human judgment adds evidence.

Prefer the repository's existing commands and testing patterns. When automation can prove a claim, use it instead of manual checking.

**Complete when:** every desired end-state item maps to at least one phase; every phase maps to specific target shapes and either test changes or an evidence-backed reason no test seam applies; each phase can be implemented and verified without unfinished work from a later phase; and dependency order contains no cycle or hidden prerequisite.

## 4. Choose the smallest explanatory views

Read [show-me.md](references/show-me.md) before drafting the change outlines. Use only the views that make ownership, contracts, data flow, or order easier to understand. Put a short connective explanation beside each view. Dense visual UI or spatial concepts may use one focused HTML artifact in the task directory.

**Complete when:** every retained view answers a concrete planning question, changed lines obey the visual notation, all paths and symbols are evidence-backed, and removing any view would make the phase materially harder to understand.

## 5. Write the artifact

Read [structure_outline_template.md](references/structure_outline_template.md), then create the next chronological artifact:

```text
.agent-work/tasks/<task-directory>/<NN>-structure-outline-<2-4-word-slug>.md
```

Use the exact existing task directory when one exists. With no existing directory, derive and create `ENG-1234-short-description` when a ticket is known and `short-description` otherwise. Determine `NN` from the highest existing two-digit prefix in the exact directory; start at `01`. Populate repository, branch, and `git rev-parse HEAD` metadata from the environment.

Capture unresolved planning questions in `Open Questions`; do not silently invent decisions. If the artifact environment provides a shareable permalink, retain it for the final response.

**Complete when:** the file exists at the next unoccupied chronological path; contains no instructional placeholders; its overview matches its phase headings; every phase has a change outline and validation section; and its metadata identifies the current repository state.

## 6. Audit the outline

Re-read the saved artifact as a reviewer. Check it against the evidence ledger, the template contract, the phase criteria, and the visualization rules. Verify every referenced local path and every runnable command that can be checked safely without performing implementation.

**Complete when:** all source decisions are represented, all desired outcomes are covered exactly once or have an explicit cross-phase reason, all local references resolve, code fences are balanced, phase numbering and overview checkboxes agree, and remaining uncertainty appears only under `Open Questions`.

## 7. Select the handoff

Read `.agent-work/workspace.json` when present and overlay
`.agent-work/workspace.local.json` when present; local values override shared
values while repository lists merge by their documented identity key. Record
the effective `disabled` value. Then run `git rev-parse --git-dir`. Choose the
branch as follows:

- output contains `.git/worktrees/`, the effective configuration has `disabled: true`, or the repository has no usable worktree workflow: read and follow [structure_outline_final_answer_in_worktree.md](references/structure_outline_final_answer_in_worktree.md);
- otherwise: read and follow [structure_outline_final_answer.md](references/structure_outline_final_answer.md).

Substitute the artifact path and any available shareable permalink. Preserve the selected template's structure and add no independent summary.

**Complete when:** both configuration layers have been accounted for, the
response points to the created artifact, requests review of phase ordering and
verification, and offers exactly the valid next command for the detected
environment.

## Revision branch

User feedback about the outline re-enters steps 1–6. Treat the feedback as an instruction to revise the artifact, even when it sounds like implementation direction. Verify factual corrections against the named artifacts and repository sources; when subagents are available, dispatch the matching foreground research role for every factual correction that changes the plan. Keep the artifact's filename stable during revision.

**Complete when:** every feedback item is either reflected in the document or recorded as an unresolved question with evidence, and the revised artifact passes the full audit again.

## Document precedence

When sources disagree, the latest approved planning decision wins in this order:

```text
structure outline > design discussion > completed research > ticket
```

Record a deliberate departure from earlier evidence in the outline so the implementation phase does not resurrect the superseded direction.

## Markdown contract

Use four backticks for an outer fence that contains Markdown with triple-backtick fences. Use repository-relative paths inside the artifact. Keep excerpts to signatures and target shapes unless a complete small block is necessary to remove ambiguity.
