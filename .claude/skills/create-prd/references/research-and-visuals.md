# Evidence and visual branches

Read this reference only when a product decision depends on current code, an established pattern, a design system, a library, external facts, or a visual comparison.

## Evidence branch

Run focused research before proposing the decision. Prefer these bounded
specialist roles when the host provides them:

- `codebase-locator` finds the files and components that define the relevant product area.
- `codebase-analyzer` explains current behavior, flows, and design-system details.
- `codebase-pattern-finder` finds comparable product or interaction patterns already implemented.
- `web-search-researcher` establishes current external facts from attributable sources.
- Use the available library researcher when a library's documented behavior constrains the product choice.

Give each agent a bounded question tied to the pending product decision. Ask only for evidence about what exists; retain product judgment in the PRD interview. Fold the findings into the relevant research artifact when one exists and cite that artifact from the PRD. If no research artifact exists, cite the primary ticket, file, documentation, or web source directly in the PRD without copying large passages.

If a named specialist is unavailable, perform its bounded evidence pass
directly with repository search, file reading, and the host's generic web
research capability where applicable. Missing delegation support must not block
the decision or permit an unsupported claim.

The evidence branch is complete when every fact that changes the options or recommendation is supported by a named source, contradictory findings are reconciled or surfaced, and the pending question can be asked without guessing how the current product works.

## Design-system branch

Before producing a UI mockup, look for documented design-system details in the task inputs. If they are absent, use `codebase-analyzer` to establish the product area's component library, colors (including exact values), typography, spacing, borders, shadows, and theming behavior.

The design-system branch is complete when the mockup can reuse the user's product language and tokens instead of an invented visual system.

## HTML mockup branch

Use Mermaid for logic, user, or business-process flows. Use focused HTML mockups for product visuals such as layouts, interactions, and meaningful UI states; prose alone is insufficient for those decisions. When comparing options, render each option inline, make it independently viewable, and label the product difference clearly.

- Write each file to `.agent-work/tasks/{task-slug}/mockup-{description}.html`.
- Use realistic product copy and data.
- Keep the mockup limited to the decision being discussed.
- Link it beside the decision it explains:

  ```markdown
  [Open the mockup](.agent-work/tasks/{task-slug}/mockup-{description}.html)
  ```

- If the current host supports an inline preview, it may additionally preview
  the same file; the ordinary Markdown link remains required.

- Iterate on requested changes until the user approves the winning version.
- Embed approved winning mockups in the PRD and update or remove stale variants as later decisions change the behavior.

The mockup branch is complete when the user can distinguish the relevant options from the rendered artifacts, the chosen artifact is explicitly approved, its linked path resolves, and its copy, states, and styling agree with the latest PRD.
