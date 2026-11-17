# Research report standard

The artifact is a technical explanation a developer can read without the investigation transcript.
Apply every rule below to every report.

## Current-state boundary

Describe observable repository state: responsibilities, locations, behavior, contracts,
interactions, and tests. Architectural rationale belongs in the report when comments, records, or
other repository evidence state it. Mark reasoned explanations that exceed direct observation as
inference.

Suggestions, judgments, future changes, optimization, refactoring, and root-cause claims appear only
when the user explicitly requests that branch. Put them in a separately labeled section so they
cannot be confused with current-state findings. Evidence causal claims to the same standard as any
other material claim.

## Narrative structure

Organize findings around concepts and behavior. A file list supports the explanation; it does not
replace it. Each section heading states its takeaway as a complete claim. A reader who scans only
the headings should still learn the system's shape.

Lead with what the mechanism does, then cite its location. Use short connected paragraphs. Place a
visual immediately beside the prose it clarifies. Preserve technical depth: compression may remove
repetition, but never evidence, boundaries, test behavior, or a connection needed to answer the
question.

## Evidence presentation

- Cite repository facts inline as `path/to/file.ext:line` or `path/to/file.ext:start-end`.
- Combine adjacent facts under one honest range rather than producing a citation for each line.
- Link external evidence with descriptive Markdown text and the direct source URL.
- Keep observation, inference, and explicitly requested recommendation distinguishable.
- Explain conflicts and uncertainty at the point where they affect the narrative, then summarize
  them in their dedicated sections.

## High-bandwidth views

Choose the smallest view that makes structure easier to understand:

- tables for comparisons, matrices, flags, fields, and mode differences;
- Mermaid for data flow, control flow, object graphs, and service relationships;
- call trees for significant execution paths through handlers, workers, services, or commands;
- annotated file trees for ownership and directory boundaries;
- component trees for UI composition, state, data access, and package boundaries;
- type signatures, endpoint shapes, schemas, events, and message examples for contracts;
- language-neutral pseudocode for branching algorithms whose behavior is harder to follow in prose.

Show relevant frames and fields, not every implementation detail. Never use diff markers to depict
current state.

When a Markdown example contains fenced Markdown, use a four-backtick outer fence so inner
three-backtick blocks remain intact.

## Testing pattern per component

Each component finding contains a `Testing pattern` subsection. Account for:

- test locations and cited ranges;
- unit, integration, and end-to-end levels that exist;
- harnesses, runners, mocks, fakes, fixtures, factories, and shared utilities;
- the behaviors and boundaries the tests exercise;
- an explicit, reproducible absence statement when the investigation found no tests.

## Code-reference index

Make the final index comprehensive enough to navigate the researched surface. Group by subsystem,
include directories that define boundaries, and label each group either `Exhaustive` for the named
boundary or `Key files` when other files may remain relevant. Each entry states the responsibility
or evidence it contains.

## Open questions

An open question records a genuine evidence gap, the evidence needed to resolve it, and the effect
of the gap on the answer. It does not ask why an unbuilt feature is absent or propose future work.
Write `None` when every original question is answered.
