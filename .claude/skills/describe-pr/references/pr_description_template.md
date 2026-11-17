# Pull-request description template

Replace every brace-delimited instruction. Remove optional links, subsections, and examples that do not apply; retain every top-level section heading below. The finished body contains evidence, never template directions.

[{TICKET_ID}]({TICKET_URL}) | [Task artifacts]({TASK_ARTIFACTS_URL}) | [Task]({TASK_URL}) | [PR walkthrough]({PR_WALKTHROUGH_URL})

## What problem this solves

{Explain the user or maintainer pain, why this change is needed now, and what becomes possible after it ships. Lead with one plain outcome sentence; add only the context required to review the solution.}

## What changes for users

{List externally observable behavior. Link each material claim to its file diff or new-side line. When the change has no user-visible effect, state that explicitly and explain the internal outcome.}

- [{behavior or surface}]({PR_URL}/files#diff-{SHA256_PATH_HASH}R{NEW_LINE}) — {observable change}

## How it works

{Walk through the implementation by responsibility or runtime sequence. Cover every material changed-file group without replaying commits or producing a flat file inventory. Link to the exact file or line where each responsibility is implemented.}

### {Responsibility or phase}

- [{path}]({PR_URL}/files#diff-{SHA256_PATH_HASH}) — {ownership, behavior, and interaction with adjacent components}

### Change outline

{Include the smallest useful structural view from `show-me.md`: a schema/API shape, pseudocode, file tree, component tree, call tree, control flow, or data flow. Use a `diff` block for a focused change to an existing shape and a complete language-specific or `text` block for a mostly new shape. Omit this subsection only when prose and links are clearer.}

```diff
 {existing shape}
-{removed responsibility or flow}
+{new responsibility or flow}
```

## Special things to note

{Give reviewers 1–5 high-value facts: breaking behavior, migrations, compatibility constraints, rollout or rollback needs, generated artifacts, security/performance implications, deliberate omissions, or surprising choices. Use `- None.` only after checking every category.}

- {reviewer-relevant fact and its consequence}

## Deviations from the plan

{If a plan exists, account for every item under the applicable classifications below. If none exists, replace all subsections with `No plan file found.`}

### Implemented as planned

- {item}

### Deviations or surprises

- {item — what changed, why, and reviewer impact}

### Additions not in the plan

- {item — rationale}

### Planned but not implemented

- {item — reason and follow-up, if any}

## How to verify it

{Give reproducible setup and verification steps using the actual branch and repository commands. Mark commands already run with their observed result. Keep suggested manual checks unchecked.}

### Observed automated checks

```bash
{command} # {observed result}
```

### Reviewer checks

- [ ] {manual or environment-specific verification step}

## Changelog

{One concise line describing the shipped outcome in user-facing language. Use `No user-facing changelog entry.` when appropriate.}
