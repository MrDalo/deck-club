---
name: review-artifact-comments
description: Review and act on threaded comments attached to a workflow artifact.
disable-model-invocation: true
---

# Review artifact comments

Treat the comments as a review queue: preserve every thread, decide each item
independently, and reconcile the artifact and comment system before reporting
completion.

An available artifact-comment integration may expose these operations:

- list or fetch the current threads for an artifact;
- append a reply to one thread;
- change comment state, including resolve, unresolve, tombstone, or restore.

Inspect the live integration schema or help before calling it. An environment
without these operations can still review inline comments and edit a local
artifact, but it cannot fetch current threads or mutate their remote state.

## 1. Resolve the artifact and comment source

Choose the ingestion branch from the information already available:

- When the prompt contains a `<comments>` block or standalone `<comment>`
  fragments, use that snapshot. The root `for` attribute identifies the
  artifact when present.
- When the prompt names a file containing an exported comment snapshot, read
  that file completely and ingest each artifact block it contains.
- When no comments are inline but the artifact path is known from the prompt or
  conversation, fetch its comments through an available read integration.
- When neither the comments nor artifact are identifiable, ask for the artifact
  path and wait.
- When fetching is required but no compatible read integration is available,
  ask the user to provide the exported comment block or enable an integration
  that can read that artifact's threads. State which capability is unavailable.

Partition multiple `<comments>` blocks by their `for` values; never apply a
thread to a different artifact merely because its quoted text matches. Resolve
each target path explicitly and read the complete artifact before evaluating
its comments. If an inline snapshot and a fetched snapshot both exist,
reconcile them by comment ID: the fetched record is current for matching IDs,
while inline-only IDs remain explicitly labeled stale snapshot records.

This step is complete when every supplied or fetched thread maps to exactly one
artifact, every mapped artifact has been read, and the source and freshness of
each comment snapshot are known.

## 2. Parse every thread

Whenever consuming or emitting the XML comment format, read
[`references/comment_xml_format.md`](references/comment_xml_format.md) in full.
It is the single source of truth for the wrapper, IDs, block context, reply
nesting, resolution marker, escaping, and malformed-input handling.

Build an in-memory review queue with one record per source comment (`<comment>`
for XML input):

- artifact path and opaque comment ID, or an explicit `ID unavailable` marker;
- quoted target block and surrounding context;
- root message plus every reply in order and at its recorded depth;
- current resolved state;
- the actionable request, question, or decision represented by the whole
  thread.

Treat quoted context as an anchor, not as the request. Treat replies as part of
the same conversation: a later clarification may narrow the root request, and
an unresolved disagreement remains open. Preserve the raw fragment beside any
record that cannot be parsed losslessly. Ask about malformed input only when
the ambiguity changes the artifact edit or requested comment mutation.

This step is complete when every supplied or fetched comment maps to one queue
record or a documented duplicate ID, every message and reply belongs to one
record, and every missing ID, missing target, malformed line, or ambiguous
resolution state is explicitly recorded.

## 3. Establish the authorized operation

Infer only the operation the user actually requested:

| User direction | Authorized work |
|---|---|
| inspect, review, summarize | analyze and report |
| apply, address, incorporate | edit the artifact |
| investigate | gather evidence and report findings |
| reply | append replies to named threads |
| resolve or unresolve | change resolution state |
| delete or remove comments | tombstone named threads |
| restore comments | reverse tombstones where supported |

Combinations authorize the union: “apply and resolve all” permits artifact
edits followed by resolution; “apply all” alone leaves comment state unchanged.
Treat reply, resolution, tombstone, and restoration as external mutations that
require explicit direction. Scope words such as `all`, an ID list, or “open
comments” determine which queue records are included.

If the invocation supplied no course of action, first report the number of open
and resolved comments, then offer a concise choice among:

1. update the artifact from the feedback;
2. update it and resolve successfully addressed comments;
3. investigate the concerns and reply with findings;
4. review only or follow another instruction.

Wait for the choice before editing the artifact or mutating a comment. Also ask
before acting when a requested scope cannot distinguish among multiple
artifacts or threads.

This step is complete when the artifact-edit scope and every permitted external
mutation are explicit, and each queue record is marked in scope or out of
scope.

## 4. Disposition each in-scope thread

Work one thread at a time against the current artifact and available evidence.
Assign exactly one disposition:

- **apply** — the requested change is correct, in scope, and actionable;
- **apply partially** — a bounded part is correct, with the omitted part and
  reason stated;
- **already satisfied** — the current artifact already contains the requested
  outcome;
- **decline** — evidence or an explicit current decision contradicts the
  request;
- **duplicate or superseded** — another identified thread or later decision
  covers it;
- **needs clarification** — materially different interpretations remain;
- **blocked** — the intended change is known but required evidence or access is
  unavailable.

Use the entire thread when choosing the disposition. A current-turn user
decision outranks older thread text. Otherwise, reply order alone does not
establish authority: when participants disagree without a clear decision,
choose **needs clarification**. For **decline**, **duplicate or superseded**,
**needs clarification**, and **blocked**, record the concrete reason or
evidence. Resolved comments still receive a disposition when they are in scope;
`already satisfied` is appropriate only after checking the artifact.

This step is complete when every in-scope comment ID has one disposition, one
planned artifact action or explicit no-change reason, and one planned thread
action or explicit no-mutation decision.

## 5. Apply artifact and thread actions

For **apply** and **apply partially**, edit the canonical artifact in place.
Locate the intended passage from the quoted target plus its surrounding lines;
when that anchor is stale, use the thread's meaning to find the current passage.
Choose **needs clarification** if zero or multiple plausible passages remain.
Preserve the artifact's format, decision history, and unrelated content.

For each thread, use this order:

1. make the authorized artifact edit, if any;
2. verify that edit in the artifact;
3. append an authorized reply that states the result, evidence, or remaining
   question;
4. apply an authorized comment-state change.

Resolve an addressed thread only after its artifact work and verification
succeed. Keep **needs clarification** and **blocked** threads open unless the
user explicitly directs otherwise. A tombstone is a reversible deletion, but
the user must name deletion as the intended operation; restoration and
unresolving use the inverse operation exposed by the live schema. If any tool
call fails, stop state changes for that thread, preserve its last confirmed
state, and continue only with independent threads whose outcomes cannot be
misrepresented by the failure.

This step is complete when every planned action has either succeeded or has a
recorded failure, every artifact edit can be tied to its comment ID, and no
reply or state transition exceeds the authorization from step 3.

## 6. Reconcile and validate

Re-read every changed artifact and inspect its diff. Apply the artifact's own
template or validation rules when available, run repository-provided checks
that cover the changed format, and verify that accepted feedback did not remove
unrelated requirements or unresolved decisions.

After any external comment mutation, fetch the artifact comments again. Compare
the returned IDs, reply tails, resolved flags, and tombstone/restoration results
with the planned actions. When refetching is unavailable, label remote state as
unverified rather than inferring success from the local artifact.

Reconcile the queue: the number of dispositions must equal the number of
in-scope comments, every artifact change must belong to an **apply** or **apply
partially** record, and every requested external mutation must have a confirmed
result or named failure.

This step is complete when those counts balance, artifact checks pass or their
failures are reported, and the final state of every in-scope comment is known or
explicitly marked unverified.

## 7. Report the result

Return a compact audit trail containing:

- the artifact path and files changed;
- each comment ID, its disposition, artifact action, reply action, and final
  comment state;
- validation performed and its result;
- unresolved questions, blocked operations, or unverified remote state.

When nothing changed, say so and give the per-comment reasons.

This step is complete when every in-scope comment appears exactly once in the
audit trail, including comments that were resolved, declined, duplicated, or
blocked.
