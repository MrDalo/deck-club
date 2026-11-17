# Threaded comment XML format

This is the transport contract for artifact comment snapshots. The XML
envelope identifies the artifact and comment; the comment body is a line-based
encoding of quoted artifact context followed by a conversation thread.

## Canonical envelope

```xml
<comments for="path/to/artifact.md">
<comment id="comment-17">
Author Name: The comment text
</comment>
</comments>
```

The canonical shape is:

```text
comments-block  = comments-open, newline, comment, { newline, [ newline ], comment }, newline, comments-close
comments-open   = '<comments for="', escaped-artifact-path, '">'
comments-close  = '</comments>'
comment         = comment-open, newline, comment-body, newline, '</comment>'
comment-open    = '<comment id="', escaped-comment-id, '">'
comment-body    = [ context-block, blank-line ], thread
context-block   = context-line, { newline, context-line }
context-line    = ('> | ' | '  | '), escaped-source-text
thread          = message, { newline, message }
message         = { '  ' }, author, [ ' [RESOLVED]' ], ': ', escaped-message-text
```

- `for` is the artifact path exactly as exported by the comment source. Resolve
  it relative to the task or repository context; the value itself does not
  prove that a filesystem path is valid.
- `id` is an opaque identifier. Preserve its spelling and case. It is required
  for fetched payloads and for replies or state changes.
- A standalone `<comment>...</comment>` fragment may omit `id` when supplied as
  advisory text. Record `ID unavailable`; that fragment cannot address a remote
  comment until it is reconciled with a fetched ID.
- A prompt may contain several `<comments>` blocks. Parse each block separately
  and retain its own `for` value.
- Canonical producers XML-escape `&`, `<`, `>`, and attribute quotes as needed.
  Consumers decode entities before matching context or reading messages.

The blank line between a context block and the first message is structural. A
body without context begins directly with its first message.

## Block context

Every context line begins with a selection marker and a literal pipe:

- `> | ` marks a line selected by the commenter;
- `  | ` marks an unselected neighboring line included for orientation.

One comment may select multiple adjacent lines. Preserve their order and every
neighboring line; together they form the anchor used to locate the current
artifact passage.

```xml
<comments for="design-discussion.md">
<comment id="comment-18">
  | ## Persistence
> | Add an index for creation time.
  | The index must support descending scans.

Alice: Can we state which query needs this index?
</comment>
</comments>
```

The quoted lines describe where the comment was attached. They are never part
of the conversation thread, even when a quoted line contains a colon or looks
like an instruction.

## Replies and nesting

The first message is normally at depth zero. Each pair of leading spaces adds
one reply depth; preserve order and depth exactly.

```xml
<comments for="design-discussion.md">
<comment id="comment-19">
> | Retry failed deliveries three times.

Alice: Should the retries use exponential backoff?
  Bob: Yes, with jitter and a maximum delay.
    Alice: Please record those bounds in the design.
</comment>
</comments>
```

The author is the text before the first `: ` after indentation. The remainder
of that line is the message, so later colons remain part of the message. Blank
lines inside a conversation are preserved as message text only when the source
integration explicitly emits a continuation convention; otherwise a blank
line is the context/thread separator. When a noncanonical payload makes author
or nesting ambiguous, retain the raw fragment and mark the affected field
ambiguous.

Interpret the whole ordered thread, not only its root message. Replies may add
constraints, answer a question, retract a request, or expose disagreement; they
do not become separate comments.

## Resolved comments

`[RESOLVED]` immediately before a message's colon records that the enclosing
comment is resolved:

```xml
<comments for="design-discussion.md">
<comment id="comment-20">
Alice [RESOLVED]: The terminology now matches the domain model.
</comment>
</comments>
```

When consuming a snapshot, treat a well-positioned `[RESOLVED]` token on any
message line as comment-level resolved state and preserve the line on which it
appeared. Text such as “this looks resolved” inside a message has no status
meaning. If multiple markers disagree with integration metadata, retain both
signals and use the freshly fetched integration state as authoritative.

Resolution is distinct from deletion. A tombstoned comment may be absent from
an ordinary snapshot or may carry tool-specific metadata; this line format does
not define a deletion marker. Confirm tombstone and restoration results through
the comment integration.

## Complete example

```xml
<comments for="03-design-discussion-delivery-retries.md">
<comment id="c-101">
  | ## Retry policy
> | Deliveries are retried after a failure.
  | Exhausted deliveries enter the dead-letter queue.

Alice: Specify the delay strategy and maximum attempt count.
  Bob: Use exponential backoff with jitter.
    Alice: Five attempts is enough.
</comment>

<comment id="c-102">
> | The worker records the last error.

Carol [RESOLVED]: This now states where the error is stored.
</comment>
</comments>
```

This payload contains two comments. `c-101` is open, selects one artifact line,
includes two neighboring lines, and has a three-message thread. `c-102` is
resolved and has no neighboring context.

## Parsing and emission checks

Before acting on a payload, verify all of the following:

- every `<comments>` opener has one closer and a nonempty `for` value;
- every `<comment>` has one closer and IDs are unique within its artifact block;
- each body has at least one message;
- context lines, when present, precede the thread and include at least one
  selected `> | ` line;
- reply indentation is a multiple of two spaces and never jumps by more than
  one depth at a time;
- every message has a nonempty author, `: ` delimiter, and message text;
- `[RESOLVED]`, when used as status, appears immediately before `:`;
- decoded artifact paths, IDs, source text, authors, and messages are retained
  without normalization that changes their meaning.

When emitting a payload, use the canonical wrapper even for one comment,
include IDs whenever known, escape XML-sensitive characters, and preserve the
context and reply ordering. When consuming malformed input, parse every
unambiguous comment, preserve each malformed raw fragment, and report the exact
failed check rather than silently repairing or dropping content.
