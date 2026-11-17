# Feedback intake and resolution

Read this reference before handling direct feedback, pasted or fetched comments, implementation discoveries, requirement changes, or continued-grilling questions.

## Build one exhaustive inventory

Capture every distinct input before selecting the active item. Keep this inventory in working state; the TDD itself remains a current-design document, not a feedback ledger.

| Field | Required content |
|---|---|
| ID | Stable local identifier; preserve an artifact comment ID when present |
| Source | User message, conversation decision, artifact comment, named file/link, upstream artifact, code evidence, implementation discovery, or verification result |
| Locator | Message/thread, comment context, artifact path, URL, or `file:line` evidence |
| Claim or request | One atomic correction, question, constraint, or proposed change |
| Affected surfaces | Boundaries, flows, contracts, data, failures, program shape, product behavior, verification, migration, rollout, backout |
| Evidence needed | Repository fact, upstream requirement, user decision, or none |
| Design state | `open`, `researching`, `needs-decision`, `incorporated`, `rejected`, `superseded`, or `blocked` |
| Comment state | When applicable: `open`, `replied`, `resolved`, or `deleted` |

Inventory these sources when available:

- The invocation and all relevant messages in the current conversation, including previously accepted choices and later corrections.
- A supplied `<comments for="…">...</comments>` block, preserving each comment ID, quoted block context, author/reply order, and `[RESOLVED]` marker.
- Live artifact comments fetched for the current TDD.
- Every file in the task directory: the current TDD, PRD/mockups, design discussion, research, ticket/task, implementation notes, diagrams, and other artifacts.
- Every file, directory, URL, log, schema, API, or code path explicitly named by the user or a comment.
- Repository evidence discovered while checking current behavior or established patterns.
- Implementation learning, test/verification results, changed requirements, and rollout constraints that arrived after the TDD was written.

Combine duplicate inputs under one item while retaining every source locator. When two inputs conflict, retain both until precedence and evidence resolve the conflict.

The inventory is complete only when every available input has an ID and locator and every active item has a design state.

## Take the artifact-comment branch only when comments are in play

When the invocation supplies comment XML, names an artifact whose comments should be fetched, or asks to reply/resolve/delete a thread, read [Artifact comment protocol](artifact-comments.md) before acting. It defines the accepted XML shape, retrieval fallbacks, authorization boundary, and state verification.

Keep design state separate from comment state: an incorporated design change does not resolve its source comment automatically, and a resolved comment does not prove that the TDD was updated. Track and report both.

## Resolve one decision as an interview loop

Take the open item with the greatest downstream dependency. Verify factual claims before treating them as constraints. Then:

1. Frame one decision at the level the TDD must settle.
2. Present two or three real options when alternatives exist, with concrete tradeoffs.
3. Recommend the option best supported by repository patterns and higher-precedence requirements.
4. Use a diagram or code-shape view appropriate to System Design or Program Design.
5. Wait for an explicit disposition.

User pushback, exploratory thinking, or a clarifying question keeps the item in `needs-decision`. Answer within the same loop and ask at most one next question. Edit the TDD only after the item becomes `incorporated`, `rejected`, `superseded`, or `blocked` with a recorded reason.

When a design item is incorporated, retain its rationale in the relevant design prose only where the rationale helps future implementers choose correctly. Keep the source thread and chronology in the working inventory rather than appending them to the TDD.
