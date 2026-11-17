# Comment Feedback

Read this reference when research feedback is supplied through artifact comments, the user asks to
fetch comments, or the invocation includes a `<comments>...</comments>` block.

## Resolve the input mode

| Input | Action |
| --- | --- |
| Pasted comment block | Parse it directly; no fetch is needed. |
| Selected artifact plus an instruction to use its comments | Fetch comments with the available artifact-comment tool. |
| Explicit feedback-file path | Read that file in full; user authorization makes it part of the baseline. |
| Comments requested but neither content nor artifact is identifiable | Ask which research artifact to use, then stop. |

If comment tools are unavailable, pasted comments can still drive the revision. When a fetch or a
thread-state change is required, tell the user which capability is unavailable and ask them to paste
the comments or continue in a task-associated session.

## Parse every thread before editing

A comment block identifies its artifact in the outer element and contains one or more comment
threads. For every thread, capture:

- comment identifier;
- quoted document context, including the line marked with `>` when present;
- author statements and nested replies in order;
- resolved state such as `[RESOLVED]`;
- requested content change and any requested thread action.

When the user says "all comments," include every unresolved thread. Include resolved threads only
when the user explicitly asks to revisit them. Track threads one by one in the revision ledger even
when their evidence research runs in parallel.

## Separate content authority from thread authority

An instruction to apply or address feedback authorizes the corresponding document revision. Thread
mutations require their own clear authorization:

| Requested outcome | Authorized operations |
| --- | --- |
| Apply or address comments | Revise the artifact; preserve thread state. |
| Reply to comments | Revise as needed and post replies; preserve resolved/deleted state. |
| Resolve comments | Revise as needed and mark the named or scoped threads resolved. |
| Delete comments | Tombstone only the named or scoped threads. |
| Reopen or restore comments | Reverse state only for the named or scoped threads. |

When the requested outcome does not distinguish edit-only from reply/resolve/delete, ask one concise
choice before mutating thread state. A reply should state the evidence-backed disposition, not merely
"done." Perform replies and state changes after the document write, verify each tool result, and
report any thread whose requested action failed.

If the outer comment block names a different artifact from the selected research document, ask the
user to confirm the target before applying content or changing thread state.

## XML shapes

```xml
<comments for="03-research-session-storage.md">
  <comment id="17">
    | preceding context
  > | statement under review
    | following context

  Morgan: Does the retry worker use this same write path?
    Ren: Please trace the worker too.
  </comment>
</comments>
```

A resolved author line may carry a state marker:

```xml
<comment id="18">
Morgan [RESOLVED]: The citation now points at the current handler.
</comment>
```
