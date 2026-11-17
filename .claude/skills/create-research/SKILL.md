---
name: create-research
description: Produce an evidence-backed map of an existing codebase.
disable-model-invocation: true
---

# Create Research

Build a self-contained explanation of the repository as it exists at the researched commit. The
default product is a technical map: what exists, where it lives, how it behaves, how its parts
connect, and how that behavior is tested.

Recommendations, redesigns, implementation proposals, critiques, and causal diagnosis are separate
assignments. Include one only when the user explicitly puts it in scope, and label it apart from
the current-state findings.

## Process

### 1. Resolve the inquiry

Read [the research protocol](references/research_protocol.md) in full before exploring. It defines
the direct-question, artifact, codebase, dependency, web, and follow-up branches; the protected-file
boundary; source precedence; delegation; artifact placement; and permalink rules.

Use the user's stated question as controlling input. If the system supplies a task artifact
directory, inspect it exactly as the protocol requires. Read every directly named input file in
full in the main context before delegating any work.

Create a coverage ledger with one row per question and columns for research area, required evidence,
test evidence, assigned investigator, and status.

This step is complete when exactly one inquiry is in scope, all authorized inputs have been read,
and every question has a ledger row. If the available inputs are ambiguous, ask the protocol's
single selection question and stop.

### 2. Design the investigation

Split the ledger into cohesive areas that can produce independently checkable findings. Mark
dependencies between areas so discovery work precedes analysis that needs its results. Choose the
applicable investigator roles and tool branches from the protocol; the skill must remain executable
when named specialists or delegation tools are absent.

This step is complete when every ledger row belongs to at least one bounded investigation, each
investigation names its expected evidence and testing coverage, and dependent work is ordered.

### 3. Collect evidence

Run independent investigations concurrently and dependent investigations in waves. Keep every
investigator read-only and require paths with line ranges, relevant symbols or entry points,
connections to adjacent components, test locations and methods, uncertainties, and external links
when web or dependency sources are used.

Wait for every dispatched investigation. Reconcile overlaps against live repository evidence and
record conflicts instead of silently choosing or averaging them.

This step is complete when each ledger row contains traceable evidence or states the exact evidence
that could not be found and why that gap matters to the question.

### 4. Build the explanation

Before drafting, read [the report standard](references/report_standard.md) in full. Synthesize by
concept and behavior, not by investigator or file. Connect boundaries and data/control flow, and
document the testing pattern beneath every component area—including an explicit finding when no
test evidence exists.

This step is complete when every material claim is traceable, every original question is answered
or precisely unresolved, cross-component connections are explained, and every finding satisfies
the report standard.

### 5. Write and close the artifact

Gather repository metadata and choose the destination before drafting, following the artifact rules
in the protocol. Then read [the research document template](references/research_template.md) and
write the complete artifact with no placeholder text.

If unresolved questions remain, perform one additional targeted investigation pass after the first
complete draft. Integrate answers into their proper sections and remove resolved entries; retain
the remaining entries as explicit open questions. Do not add a second research appendix.

This step is complete when the artifact path and chronological prefix are valid, metadata reflects
the researched snapshot, every required section is populated, and the coverage ledger has no
unclassified or silently omitted row.

### 6. Hand off the result

Read [the final-answer contract](references/research_final_answer.md) and follow its applicable
branch. Include an artifact link when the host provides one; otherwise provide its local path.
Include durable source permalinks only when the protocol's reachability check passes.

For later questions about the same inquiry, update this artifact in place. Expand or correct the
relevant findings and references rather than appending an unintegrated answer dump.

This step is complete when the user can open the artifact, see whether any question remains open,
and identify the next available workflow action.
