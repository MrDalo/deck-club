# Visual iteration

Use this reference whenever feedback or an open decision changes a UI flow, layout, interaction, or visible state.

## Show the decision

Create or update focused HTML mockups in:

`.agent-work/tasks/<task-slug>/mockup-<description>.html`

Use the product's evidenced design system, components, typography, and colors. Use realistic labels and data. Show two or three genuinely different options when the decision is open, and show before and after when the change would otherwise be ambiguous.

Display the relevant mockup inline with the host's available preview capability while discussing the decision. When inline preview is unavailable, provide the direct local artifact link in the same message. Once resolved, keep the winning mockup current and link it beside the related behavior:

```markdown
[Open the interactive mockup](mockup-<description>.html)
```

Update an existing artifact when it represents the same decision. Create a new artifact when the new UI has a distinct purpose or state. Remove or relabel stale embeds so the PRD cannot imply two winners.

Completion criterion: every changed visible behavior appears in the winning mockup, the PRD prose and mockup agree, and every linked artifact path resolves.
