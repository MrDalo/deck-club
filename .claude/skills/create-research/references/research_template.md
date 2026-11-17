---
date: [ISO-8601 date and time including timezone]
git_commit: [researched commit SHA]
branch: [researched branch]
repository: [repository name]
topic: "[research topic]"
type: research
tags: [research, codebase, relevant-system-tags]
status: complete
---

# Research: [Research topic]

- **Date**: [same timestamp as frontmatter]
- **Git commit**: [same commit as frontmatter]
- **Branch**: [same branch as frontmatter]
- **Repository**: [same repository as frontmatter]

## Research Questions

[Copy every question from the controlling query or selected research-questions artifact. Preserve
its meaning and order; number the list when it contains more than one question.]

## Method and Scope

This report documents the repository's observed state at the commit named above. Current-state
findings are separated from interpretation, and every material claim points to reproducible
evidence. Suggestions and implementation work are outside scope unless the research questions
explicitly request them.

[Name the areas examined, any explicitly authorized external sources or causal analysis, and the
limits of the investigation.]

## Executive Answer

[In two to four focused paragraphs, answer the inquiry and connect the dominant architecture,
behavior, and data/control-flow findings. Preserve important qualifications.]

## Question Coverage

| # | Answer | Primary evidence | Status |
|---|---|---|---|
| 1 | [concise answer or exact gap] | [`path:line-range` or external source] | Answered / Open |

## Detailed Findings

[Use numbered, concept-centered sections. Each heading states a conclusion a reader learns by
skimming it. Explain behavior before naming its location, weave citations into the prose, and put a
diagram, table, tree, signature, contract, or pseudocode beside the explanation whenever it shows
the structure faster than prose.]

### 1. [A complete sentence stating the first finding]

[Explain the mechanism, its boundaries, and its connections to adjacent components. Cite all
material statements with repository line ranges or linked external sources. Distinguish observed
facts from inference.]

#### Testing pattern

[Identify test files and line ranges; unit, integration, or end-to-end approach; mocks, fixtures,
and shared utilities; and the behavior covered. Write "No test evidence found" plus the searched
scope when the investigation found none.]

### 2. [A complete sentence stating the next finding]

[Repeat the finding and testing structure for every researched component area.]

## Architecture and Interactions

[Explain component ownership, module or service boundaries, composition, entry points, and
data/control flow. Record architectural rationale only when repository evidence states it; label
any inference.]

## Code References

[Group references by subsystem. Mark each group as exhaustive for the stated boundary or as a key-
file survey. Include directories when they define an ownership boundary.]

### [Subsystem] — [Exhaustive / Key files]

- `path/to/file.ext:12-38` — [role and relevant behavior]
- `path/to/directory/` — [boundary and what was examined within it]

## External Sources

[List official dependency documentation and other authorized web evidence as descriptive Markdown
links. State "None" when repository evidence alone answered the inquiry.]

## Conflicting or Ambiguous Evidence

[Describe each conflict and the competing evidence without averaging it away. State "None" when no
conflict was found.]

## Open Questions

[List only unanswered investigative questions, with the missing evidence and its impact on the
answer. State "None" when every question is answered.]
