---
name: show-me
description: Turn the current topic into the smallest useful visual explanation.
disable-model-invocation: true
---

# Show Me

Answer the user's current question visually. Lead with the point, keep prose brief, and use the least complex view that exposes the important relationship.

## 1. Frame the visual question

Infer the one question the visual must answer from the current conversation. Ask one concise clarifying question only when multiple materially different readings remain. Gather the user-provided or repository evidence for every entity, relationship, label, order, state, and value that will appear.

Treat evidence status as part of the picture:

- Render verified current behavior without qualification.
- Mark designs and expected future behavior as `proposed`.
- Mark reasoned but unverified relationships as `inferred`.
- Show an unknown as `unknown` instead of inventing it.
- When statuses mix, include a compact textual legend and encode status in labels or line patterns as well as color.

This step is complete when every prospective visual claim is either traceable to evidence or explicitly status-labeled.

## 2. Choose the smallest sufficient form

| Question to answer | Form |
|---|---|
| Exact mapping, option comparison, repeated fields | Markdown table |
| Algorithm, condition, transformation | Pseudocode |
| Runtime nesting or caller-to-callee shape | Call tree |
| UI composition, state ownership, module boundary | Component tree |
| File ownership or broad refactor | Shallow file tree |
| Existing shape versus changed shape | Structural `diff` |
| Copyable new code shape or contract | Signature or complete code block |
| Branching control, data movement, component relationships | Mermaid flowchart |
| Time-ordered interaction among actors | Mermaid sequence diagram |
| Lifecycle and event-driven transitions | Mermaid state diagram |
| Coarse spatial layout | Text wireframe |
| Dense spatial detail, responsive states, or useful interaction | Standalone HTML artifact |

Use prose alone when it is clearer than a visual. Combine forms only when each answers a distinct part of the question; place each visual beside the sentence it supports.

For a table, pseudocode, tree, signature, structural diff, or text wireframe, read [references/text-views.md](references/text-views.md). For a Mermaid flowchart, sequence diagram, or state diagram, read [references/mermaid-diagrams.md](references/mermaid-diagrams.md). For the HTML branch, read [references/html-artifacts.md](references/html-artifacts.md) before creating the file. Apply the selected branch's construction and verification rules.

This step is complete when each selected form has a distinct job and no simpler form would communicate it as well.

## 3. Draft from evidence

Use the domain names, symbols, paths, labels, states, and boundaries found in the evidence. Keep only the nodes, edges, columns, props, files, or controls needed to answer the framed question. Preserve order when order carries meaning; label edges when their meaning is not obvious.

Choose a structural `diff` when the user needs the delta against a known baseline. Show the entire shape when the baseline contributes little, parent context determines the meaning, or a reusable example is the deliverable.

This step is complete when every included element advances the answer and removing any remaining element would lose relevant meaning.

## 4. Verify the rendered result

Apply the branch-specific checks in the loaded reference. Then verify the shared contract:

- The title or lead sentence states the takeaway rather than naming a generic topic.
- Reading order and direction are unambiguous.
- Text labels carry the meaning; color is supplementary.
- A short adjacent interpretation makes the visual understandable when rendering, color, or interaction is unavailable.
- Paths, symbols, values, and relationships agree with their evidence.
- Proposed, inferred, and unknown content is distinguishable from observed fact.

This step is complete when every shared and branch-specific check passes, including an actual render check for Mermaid or HTML when the host provides one; otherwise the response must name the unchecked rendering risk.

## 5. Deliver

Start with the answer, show the visual immediately beside it, then add only the interpretation or evidence notes needed to prevent misreading. For repository-backed facts, link the most useful local files or cite the relevant source locations.

When the output is HTML, use the destination the user selected. If the user did
not select one, save that HTML artifact to:

```text
.agent-work/tasks/{task-slug}/show-me-{description}.html
```

Return a standard file link to the saved artifact. When the host exposes a native preview or attachment mechanism, use it in addition to the link.

For text, Markdown, or Mermaid output, render it directly in the response unless
the user requested a file destination; never wrap those forms in an HTML file
merely to persist them.

The skill is complete when the delivered visual directly answers the framed question, all claims meet the evidence contract, the output is accessible without color alone, and the selected form is the smallest one that works.
