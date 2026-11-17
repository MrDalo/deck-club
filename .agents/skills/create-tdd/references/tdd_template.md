---
task: eng-xxxx-description
type: design-tdd
repo: current-repository
branch: current-branch
sha: current-head-sha
---

# Technical Design: [Specific change]

<!--
Create the initial file with only the frontmatter, title, three required sections,
and these comments. Replace every frontmatter placeholder from repository evidence.

Build System Design first; Program Design stays empty until System Design approval.
Within both sections, use fourth-level headings that assert the decision, such as
"Exports run after the transaction commits" rather than "Export flow". Keep the
current behavior and target delta together. Put each diagram, contract, or code
shape directly beside the prose it supports.

Rewrite sections as decisions settle. The finished TDD is a coherent design rather
than a Q&A transcript, requirement copy, chronology, or exhaustive file inventory.
-->

### System Design

<!--
Show how participating components interact and how that arrangement changes.
Cover boundaries, ownership, contracts, durable state, failure behavior, security,
observability, compatibility, rollout, and verification where applicable.
-->

### Program Design

<!--
After System Design approval, show the internal code shape that implements every
changed boundary. Use selective call trees, component trees, file-tree diffs,
dependency maps, signatures, or pseudocode in the repository's language.
-->

<!--
Add the following section only after a settled decision creates a meaningful
technical exclusion:

### What We're Not Doing

[State the exclusion and the reason it is outside this design.]
-->

### Patterns to Follow

<!--
Cite existing implementation patterns by file path or symbol and include a short
snippet showing the reusable shape. Explain any approved deviation.
-->
