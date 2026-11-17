# Design discussion document contract

Use this contract whenever creating or updating the design discussion. Replace
every placeholder and remove all instructional comments from the
written artifact.

## Metadata

Populate repository facts at write time.

```yaml
---
task: "<task directory name>"
type: design-discussion
repo: "<current repository>"
branch: "<current branch name>"
sha: "<result of git rev-parse HEAD>"
---
```

## Decision-state rules

The question sections are a decision ledger:

- An initial draft places every choice under **Design Questions**. A codebase
  convention can justify a recommendation, but only clear user feedback can
  resolve the choice.
- A feedback update moves each clearly answered question to **Resolved Design
  Questions**. The user does not need to use the word “resolve.” Record the
  chosen option and rationale, then name the rejected options and why they were
  rejected.
- A question exists under exactly one heading. Keep **Resolved Design
  Questions** empty in the initial draft.
- The latest design discussion supersedes research, and research supersedes the
  ticket. Explain material departures from an earlier source in the relevant
  decision entry.

## Content rules

- Describe Current State as product behavior, user experience, gaps, and pain
  points. Keep implementation symbols and file paths in architecture or
  patterns instead.
- Describe Desired End State as observable outcomes, capabilities, and user
  stories.
- Bound the proposal with explicit exclusions under What we're not doing.
- Show both before and after architecture. Prefer concise Mermaid diagrams;
  add prose or pseudocode where a diagram cannot carry the detail.
- Give every major design choice its own question with viable options, concrete
  tradeoffs, and a recommendation grounded in repository conventions.
- Include a brief testing approach when research found an applicable test
  pattern.
- Under Patterns to follow, cite exact repository paths and include concise,
  multiline excerpts from the existing implementation. Pair them with proposed
  pseudocode or a target-shape example when that makes the convention actionable.
- When an example itself contains Markdown triple fences, wrap the outer example
  in four backticks so the inner fence remains intact.

The document is complete only when every rule above is reflected in a section
below, every material design choice is represented as open or resolved, and
every repository-specific recommendation is traceable to evidence.

## Document template

````markdown
### Summary of change request

[Concise synthesis of the user's request and the controlling task artifacts.]

### Current State

- [Observable behavior or user experience today.]
- [Gap, limitation, or pain point.]

### Desired End State

- [Observable outcome when the change is complete.]
- [New capability or solved user problem.]

### What we're not doing

- [Explicitly excluded behavior, migration, or adjacent work.]

### Proposed End State Architecture

Before:

```mermaid
[Current components and flow.]
```

After:

```mermaid
[Proposed components and flow.]
```

[Concise architectural explanation, including pseudocode where useful.]

### Design Questions

#### [Decision title]

[One answerable design question.]

- **Option A — [name]:** [Approach and concrete tradeoffs.]
- **Option B — [name]:** [Approach and concrete tradeoffs.]

**Recommendation:** [Preferred option and repository-grounded rationale.]

[Repeat for every open question. Leave this section with no question entries
once all questions are resolved.]

### Resolved Design Questions

[Initial draft: leave this section empty.]

#### [Resolved decision title]

**Decision:** [Chosen option.]

**Rationale:** [Why the choice fits the requirements and codebase.]

**Rejected options:** [Other options and why each was not chosen.]

**Pattern:** [Applicable path, pseudocode, diagram, or convention.]

[Feedback update: repeat for every resolved question.]

### Testing Approach

- [Existing test style and exact example path.]
- [Behavior or boundary the implementation should verify.]

[Omit this section only when the evidence contains no applicable testing
pattern.]

### Patterns to follow

These existing patterns should guide implementation of the proposed end state.

#### [Pattern name]

[Why the pattern applies.] — `[path/to/file]`

```
[Concise multiline excerpt from the existing codebase.]
```

```
[Concise proposed shape or pseudocode that applies the pattern.]
```

[Repeat for every implementation-critical pattern.]
````
