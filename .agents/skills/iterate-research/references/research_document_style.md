# Research Document Style

Read this reference immediately before editing a research artifact and use it again during final
validation.

## Preserve the artifact while recomposing it

Keep the selected path and the document's established format. Retain useful unaffected findings and
citations; integrate revisions into the sections where a reader needs them instead of appending a
feedback log. Apply the frontmatter rules in the main skill while recomposing the body.

A complete research artifact contains, either as explicit sections or clearly equivalent material:

- the research question and a summary that answers it;
- detailed findings organized by component or concept;
- traceable code references;
- architecture, boundary, and interaction documentation;
- testing patterns for every affected component, including an explicit finding when no tests exist;
- genuine open questions for evidence that remains unavailable.

## Tell a concept-first technical story

The document should stand alone for a developer who has not followed the investigation. Explain a
concept and then cite its implementation. Use short paragraphs and transitions to connect entry
points, transformations, state, side effects, and tests. Lists inventory fields or alternatives;
they do not replace the explanatory narrative.

Findings headers assert the takeaway. A reader scanning only headings should learn how the system
works:

- Topic label: `### Session persistence`
- Question label: `### Where are sessions persisted?`
- Takeaway: `### The request is acknowledged only after the session row commits`

When revised evidence changes a takeaway, update the header, section body, summary, architecture
description, code-reference index, and open questions together.

## Place evidence beside each claim

Use `path/to/file.ts:40-68` for a local range and a commit-pinned repository link when one is valid.
Adjacent facts from the same range share one citation. State whether a Code References group is
exhaustive for its area or a representative set. Cite directories only when responsibility truly
belongs to the directory rather than an individual file.

Keep quotations from external sources short and linked. Distinguish observed code, documented
behavior, runtime evidence, and inference in the sentence that uses each one.

## Choose the view that exposes the shape

Use a visual when it makes structure or sequence faster to understand than prose, and place it
immediately after the paragraph it supports.

| View | Best use |
| --- | --- |
| Table | Capability, configuration, state, or contract comparisons |
| Mermaid | Data flow, sequence, object graph, or multi-component architecture |
| Call-stack tree | Important runtime calls from an entry point to effects |
| File tree | Responsibility split across a directory or package |
| Component tree | UI composition, state hooks, and module boundaries |
| Signature or contract | Function types, endpoints, events, messages, and schemas |
| Pseudocode | Complex current behavior where source syntax would obscure the algorithm |

Example call-stack tree:

```text
receiveEvent
  verifyEnvelope
  loadSubscription
    subscriptionStore.find
  enqueueDelivery
    deliveryQueue.publish
```

Example boundary contract:

```text
POST /events/:stream
  request:  { cursor, payload }
  response: { acceptedAt, eventId }
```

Represent only current state: diagrams and examples describe observed behavior rather than proposed
diffs. Keep the significant frames and fields; omit detail that does not change the reader's model.

When a Markdown example itself contains fenced Markdown, give the outer fence four backticks so the
inner three-backtick fence remains intact.

## Keep open questions investigable

An open question names a missing connection or unavailable fact and the evidence needed to close it,
for example: “Which registration path enables `ArchiveWorker` in production? The deployment manifest
is not present in this repository.” Design wishes and rhetorical critique belong outside this list.
Write `None.` when every in-scope question is resolved.

The artifact is ready when its narrative remains cohesive, every changed claim is locally traceable,
all affected components include their tests or absence of tests, all visuals agree with the prose,
and no placeholder or unsupported conclusion remains.
