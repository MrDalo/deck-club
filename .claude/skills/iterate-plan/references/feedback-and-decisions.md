# Feedback and Decisions

Read this reference when plan feedback arrives through comments, a ticket or task file, or an artifact-comment tool.

## Feedback sources

Collect feedback from the sources actually present in the invocation:

1. direct instructions in the current user message;
2. an inline `<comments for="...">` block;
3. a supplied ticket, task, review, or comment-export file;
4. comments fetched through a configured artifact-comment integration when the user asks to use them or when the invocation identifies the artifact but omits the comment body.

For the fourth source, use the configured artifact-comment integration. If the session has no such integration, tell the user which comments cannot be retrieved and ask them to paste the comments or open a session that exposes the artifact. Continue with other explicit feedback only when it forms a coherent revision by itself.

If the user supplies comments but gives no action, inventory them and ask whether to apply them, investigate and reply, or apply and resolve them. Treat a request such as “apply all comments” as authority to edit the plan, not authority to change comment state.

## Comment state

Track each comment by its identifier when one is available. Applying a comment, replying to it, resolving it, and deleting it are distinct actions.

- Edit the plan when the user authorizes applying the feedback.
- Reply, resolve, reopen, delete, or restore a comment only when the user explicitly authorizes that state change.
- Leave already-resolved comments resolved and exclude them from the revision set unless the user asks to revisit them.
- When state changes are authorized, perform them one comment at a time and confirm the result before advancing.

## Decision boundary

Resolve factual questions with repository evidence. Escalate a choice when two or more viable outcomes materially alter requirements, public behavior, scope, architecture, migration risk, or implementation order.

Ask exactly one decision per message. Present two or three viable options when possible, state the concrete tradeoff of each, and recommend one. Avoid asking for confirmation when the feedback has one evidence-backed interpretation.
