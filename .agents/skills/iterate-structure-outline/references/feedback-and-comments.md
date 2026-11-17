# Feedback and artifact comments

Use this reference when feedback comes from a file, an artifact-comment block, or artifact comment tools.

## Acquire the complete thread

Feedback can arrive through any combination of:

- direct instructions in the conversation;
- a ticket or other file containing review notes;
- a `<comments for="...">` block;
- artifact comments fetched for the known outline path.

When the user asks to inspect comments and none were supplied, call the available artifact comment-fetch tool for the outline. If neither a comment block nor an artifact path is known, ask which artifact to inspect. If comment tools are unavailable, process supplied comment XML normally; when fetching or changing server-side state is required, explain that the current session lacks artifact comment access.

Read [the comment XML format](comment-xml-format.md) when parsing comment XML. Capture the comment ID, quoted context, every reply, and any `[RESOLVED]` marker. Treat the latest reply as context, not automatically as the final decision; use the whole thread.

The acquisition is complete when every supplied or fetched comment has an ID or stable source location and its entire thread is represented in the feedback checklist.

If the user asked only to read, inspect, or summarize comments, present the inventory and ask one focused question offering the applicable next actions: investigate, edit, reply, or edit and resolve. Wait for that choice before changing the outline or comment state.

## Separate content disposition from comment state

For each comment, determine both axes:

| Content disposition | Meaning |
|---|---|
| Incorporate | Verified feedback requires an outline edit. |
| Already represented | The current outline already satisfies the request. |
| Decline with evidence | Verified evidence contradicts the request or makes it unsafe. |
| Defer with owner | The concern belongs to a later artifact or named decision-maker. |
| Needs decision | Multiple viable outcomes remain and the user must choose. |

| Comment state | Meaning |
|---|---|
| Open | Discussion or action remains. |
| Addressed, open | The document changed, but resolution was not authorized. |
| Resolved | The user requested resolution and the associated work succeeded. |
| Reopened | The user requested reopening, or new evidence invalidated the prior resolution and reopening was authorized. |
| Deleted | The user explicitly requested deletion. |

Document edits do not imply comment-state permission. Direct requests such as “apply and resolve all comments” authorize resolution after successful edits; “apply the feedback” authorizes document changes while comments remain open. Ask one focused question when the requested state is ambiguous.

## Apply and verify

Process every comment even when several point at the same passage. Coalesce overlapping edits in the document, while retaining a separate disposition per comment ID.

For each comment:

1. Verify factual claims against current sources.
2. Apply the content disposition to the outline.
3. Reply when requested, stating the concise disposition and evidence or resulting section.
4. Apply an authorized state change only after the outline edit or answer succeeds.
5. Re-fetch comments when possible and confirm the requested state by ID.

A resolved marker on input is authoritative history. Preserve it unless the user explicitly asks to reopen it. A failed edit, reply, or state update leaves that comment pending and must appear in the final pending list. An incorporated comment left open because resolution was not authorized is `addressed, open`; report it accurately without treating the server-side marker as unresolved content.

Comment handling is complete when every comment ID has a content disposition, its authorized server-side action has been verified, and unresolved actionable comments are listed as pending.
