# Feedback, evidence, and resolution

Use this reference whenever an iteration includes direct feedback, ticket notes, artifact comments, disagreement, or a claim about existing behavior.

## Resolution ledger

Keep the ledger in working notes rather than appending it to the PRD. Give every input one entry with:

- source: user message, artifact and comment identifier, ticket section, or discovered PRD gap;
- target: requirement identifier or exact section and behavior;
- classification: clarification, correction, product requirement, acceptance change, scope change, success measure, visual change, technical deferral, or disagreement;
- evidence: sources required and sources checked;
- disposition: open, needs evidence, needs decision, incorporated, rejected with rationale, superseded, duplicate, or deferred to TDD;
- effects: every PRD section, mockup, dependency, and comment action touched.

A complete ledger has one final disposition for every input. `Needs evidence` and `needs decision` are intentionally open and must lead to one precise user question or a named research action.

## Comment branches

Comments may arrive inline or through artifact tools.

- If the invocation contains a `<comments for="...">` block, use that artifact and those comments.
- If an artifact is known and artifact-comment capabilities are available, fetch its current comments.
- If comments were requested but neither the artifact nor a comment block is known, ask for the artifact with one question.
- If comment tools are unavailable, work from supplied comment text or ask the user to paste it or move the session into the associated task.

Read the artifact before interpreting its comments. A comment's selected text, replies, author, identifier, and resolution state are all evidence. Preserve comment identifiers in the ledger.

The user's instruction defines the authorized action:

- `apply` authorizes document edits;
- `reply` authorizes a response through the available comment capability;
- `resolve`, `reopen`, or `delete` authorizes that exact status mutation.

Offer these actions when useful. Execute only the actions the user selected. Resolve a comment after its request is incorporated, deliberately rejected with an explained rationale, or answered with sufficient evidence. Keep it open when a decision or evidence gap remains. Process an authorized batch completely, while preserving a distinct ledger result for every comment.

## Evidence branches

Use the cheapest source that can settle the claim:

1. the user's explicit product decision for desired behavior;
2. the newest authoritative task artifact for earlier decisions;
3. direct code, tests, configuration, or product evidence for current behavior;
4. focused code research for cross-cutting or unfamiliar behavior.

Research existing functionality before asserting how it works or committing the PRD to match it. Locate the responsible code, analyze the behavior and edge cases, then find analogous patterns when the decision depends on convention. Record concrete paths and lines in the ledger; include them in the PRD only when they help a product reader.

Conflicting evidence keeps the item open. Present the conflict and ask the single product decision that resolves it.

## Resolution test

An item is resolved only when its intended behavior, affected users or actors, relevant boundary conditions, and scope are clear enough to write observable acceptance criteria. Discussion alone is not resolution. A user's explicit wording or selection is resolution unless it contradicts another active requirement; that contradiction must be settled first.
