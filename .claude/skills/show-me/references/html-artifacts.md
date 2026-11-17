# Standalone HTML artifacts

Use this branch when spatial detail, responsive layout, multiple visual states, or purposeful interaction makes Markdown, Mermaid, or a text wireframe materially less clear. Produce one focused artifact for the framed question.

## Build from evidence

Inspect the target product's available design system, styles, and UI components when the artifact represents an existing product. Reuse its actual colors, type scale, spacing, radii, labels, and data where evidence exists. Clearly label speculative UI or data as `proposed`; use neutral representative content only when no real example is available.

Keep the artifact self-contained: inline its CSS and JavaScript, avoid build steps, and avoid network-dependent fonts or assets. If a required product asset cannot be embedded, provide a meaningful text or CSS fallback.

## Compose the artifact

- Put one assertive takeaway in the page title and visible heading.
- Use semantic landmarks and heading order (`header`, `main`, `section`, `nav`, `aside`) that match the visual hierarchy.
- Show the minimum controls, states, annotations, and relationships needed to answer the question.
- Use real control elements for interaction. Buttons, tabs, dialogs, and disclosure controls must work with pointer and keyboard input.
- Support the desktop and mobile arrangements relevant to the question. Prefer natural reflow over shrinking a desktop canvas.
- Make status and relationships readable through text, shape, border, or pattern; color may reinforce but never carry the only distinction.
- Give informative images alternative text, mark decoration appropriately, associate labels with controls, expose focus visibly, and preserve a logical focus order.
- Respect `prefers-reduced-motion`; keep motion purposeful and avoid auto-playing or looping effects that are required to understand the artifact.
- Include an adjacent prose summary in the delivered response so the conclusion survives without CSS, color, JavaScript, or inline display support.

## Save and display

Honor a destination chosen by the user. Otherwise use a lowercase kebab-case task slug and short description, create parent directories when needed, and save exactly one primary artifact at:

```text
.agent-work/tasks/{task-slug}/show-me-{description}.html
```

Return a standard file link to the saved artifact. When the host exposes a native preview or attachment mechanism, use it in addition to the link. Link secondary evidence separately. The HTML artifact is the visual output, not a substitute for the concise answer around it.

## Verify before delivery

1. Parse the file with an available HTML validator or parser and resolve structural errors.
2. Open the saved file in a browser. Inspect at a desktop viewport and a narrow mobile viewport; check overflow, clipping, wrapping, density, and reading order.
3. Exercise every interactive state with pointer and keyboard. Verify focus visibility, labels, state changes, and escape/close behavior where applicable.
4. Inspect with reduced motion enabled and at increased text zoom. Confirm that meaning and operation survive.
5. Reconcile every visible value, label, state, and relationship against the evidence-status inventory.
6. Confirm the response link resolves to the saved file exactly and any native preview opens the same artifact.

This branch is complete only when the file parses, both viewport layouts remain legible, every included interaction works from the keyboard, the visual does not rely on color alone, all depicted claims satisfy the evidence contract, and the response links the exact saved artifact. If a required verification tool is unavailable, report the unchecked item rather than claiming it passed.
