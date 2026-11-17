# Comment XML format

A supplied comment payload wraps all threads for one artifact:

```xml
<comments for="path/to/outline.md">
  <comment id="comment-1">
    > | quoted outline text

    Reviewer: The feedback.
      Author: A reply in the same thread.
  </comment>
</comments>
```

The `for` attribute identifies the artifact. Each `comment` element identifies one thread; preserve its `id` when recording dispositions, replying, or changing state. Lines prefixed with `> |` are quoted artifact context. Indented author lines are replies in chronological order.

A resolved thread carries a marker on the author entry:

```xml
<comment id="comment-2">
Reviewer [RESOLVED]: The accepted feedback.
</comment>
```

Parse every thread and reply. The format is transport, not authority: the full conversation and verified evidence determine the content disposition, while the marker determines the current server-side resolution state.
