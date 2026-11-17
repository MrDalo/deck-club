# PRD artifact contract

Use this structure for the completed PRD. Replace every bracketed instruction with real content, remove unused optional blocks, and preserve the frontmatter keys.

````markdown
---
task: eng-xxxx-description
type: design-prd
repo: [current repository]
branch: [current branch]
sha: [current HEAD SHA]
---

# [PRD title]

## Problem to Solve

[Describe the user pain or business need, what people experience today, and the product gap. Reference upstream evidence; keep implementation paths and symbol names out of this section.]

[When it clarifies the problem, place a Mermaid user, business, or logic flow here.]

## What does business success look like, and how can we measure it?

[State what becomes true for users and the agreed signal, target, benchmark, or qualitative read that will show whether the work succeeded. Reference experiments or feature flags when relevant.]

## Proposed Solution

- **[Chosen direction]** — [High-level behavior and why this direction wins.]

[Place a high-level flow or approved mockup beside the behavior it explains when useful.]

## Alternative Solutions Considered

- **[Credible alternative]** — [Why it was not chosen.]

## Solution Details

### [Takeaway heading stating the first product behavior]

[Describe the experience, functionality, states, and behavior precisely.]

[When useful, place a Mermaid flow here.]

[For an approved HTML mockup, link the real file:]

[Open the approved mockup](.agent-work/tasks/{task-slug}/mockup-{description}.html)

[Explain behavior the visual alone cannot establish.]

### [Takeaway heading stating another product behavior]

[Continue until every in-scope product behavior is specified.]

## Out of Scope

- [Product behavior intentionally excluded from this work.]

## Deferred to TDD

- [Implementation decision intentionally left to technical design.]
````

`Alternative Solutions Considered`, `Out of Scope`, and `Deferred to TDD` may be omitted while empty. Add each as soon as its branch has content. Do not leave placeholders, empty headings, or instructional text in the approved PRD.

The artifact satisfies this contract only when every retained section contains resolved, internally consistent product information and every placeholder has been replaced or removed.
