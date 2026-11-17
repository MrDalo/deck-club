# Artifact comment protocol

Read this reference only when artifact comments are an input or the user requests comment replies or state changes.

## Parse supplied comments without losing identity

A supplied block uses this shape:

```xml
<comments for="path/to/technical-design.md">
  <comment id="comment-1">
    | surrounding line
  > | commented block
    | surrounding line

  Alex: The contract needs an explicit timeout outcome.
    Sam: Agreed; it should be retryable.
  </comment>
  <comment id="comment-2">
  Robin [RESOLVED]: Rename the component in the diagram.
  </comment>
</comments>
```

Preserve:

- the artifact path from `for`;
- each comment ID;
- quoted block context and its anchor in the current artifact;
- author and reply order;
- the resolved marker independently from design incorporation.

If the quoted anchor moved, locate its current semantic equivalent and record that mapping. If no reliable anchor remains, keep the item open and ask one location question.

## Acquire the source once

Choose exactly one branch:

1. **A comments block was supplied:** parse it directly. Fetch live state only when the user requests it or the block is visibly incomplete.
2. **The artifact is known and no block was supplied:** use the environment's artifact-comment retrieval capability, then inventory every returned thread.
3. **The artifact is unknown:** ask which artifact to inspect and stop.
4. **Retrieval is unavailable:** state that this session cannot fetch comments and ask the user to paste the comments or reopen the work where artifact capabilities are available.

If comments are available but the user supplied no action, ask one choice question: incorporate feedback, investigate and reply, incorporate and resolve, or specify another action. Stop before mutating the design or comment state.

## Mutate comments only within authorization

- Reply when the user asks to report findings or explain a disposition.
- Resolve after the design item is settled only when the user asked for resolution.
- Delete only on an explicit delete instruction; treat deletion as reversible when the environment exposes restoration.
- Reopen or restore only on an explicit request.
- Preserve existing resolved/deleted states otherwise.

After a reply or state change, inspect the capability result or retrieve the thread again. The branch is complete when every requested comment ID has the requested observable state and the corresponding design item has its own separately reported state.
