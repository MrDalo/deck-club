# Text views

Read the section for the selected form. Labels and topology must carry the answer.

## Markdown table

Use a table for exact mappings, comparisons, inventories with repeated fields, or state matrices.

- Give each column one stable meaning and use comparable units and levels of detail down the column.
- Put the compared subjects in rows unless transposing materially reduces width.
- Use `—`, `unknown`, or an evidence-status label for absent information; an empty cell is ambiguous.
- Keep cell prose short. Split the table or choose another form when cells become paragraphs or the table requires horizontal scrolling to understand.
- Put the decision-driving columns first. Add a source/status column only when evidence differs by row.

Check: every row can be compared on the same axes, every cell has an unambiguous meaning, and the table still answers the question when read as plain text.

## Pseudocode

Use pseudocode for conditions, algorithms, policies, retries, transformations, and failure handling.

```text
on publish(report)
  if validation fails
    return issues
  store report
  notify subscribers
```

- Name operations with the system's domain language.
- Use indentation for scope and explicit words for conditions, loops, returns, and failures.
- Include only branches that affect the user's question.
- Treat it as an explanatory model. Use a language-tagged complete block instead when syntax, types, or copyability matter.

Check: every branch has a clear condition and outcome, indentation cannot be read two ways, and no syntax implies an unsupported implementation fact.

## Trees

Use a shallow indented tree for nesting, ownership, or containment. Preserve sibling order only when the evidence establishes order; otherwise say the ordering is illustrative.

### Call tree

Show runtime control flow as caller followed by callees. Include asynchronous boundaries, callbacks, or repeated calls only when they alter the explanation.

```text
handleUpload
  validateFile
  persistBlob
  enqueueAnalysis
  respondWithJobId
```

Annotate truncation (`…`), conditional calls (`[if valid]`), and inferred edges (`[inferred]`) inline. A call tree is nesting, not a timeline; use a sequence diagram when timing or actor handoffs matter.

### Component tree

Show UI composition with relevant state, hooks, props, and module boundaries.

```tsx
<DashboardPage>  apps/web/src/routes/dashboard.tsx
  useJobFeed()
  <JobToolbar>
    <RetryButton />  packages/components
```

Include a path only where ownership or a boundary matters. Distinguish containment from data flow with labels or a separate flowchart.

### File tree

Show file responsibility or a broad refactor as a shallow tree. Annotate responsibility instead of listing every file.

```text
src/
├── intake/         # accepts and validates uploads
├── analysis/       # owns processing rules
└── delivery/       # publishes completed reports
```

Check for every tree: indentation is balanced, each child has exactly one depicted parent, omitted depth is marked, and every shown level matters to the answer.

## Signatures and complete code shapes

Use a signature when the contract is the point. Use a complete block when most of the shape is new, ownership or order requires context, or the result should be copyable.

```ts
function selectRenderer(format: OutputFormat): Renderer {
  return renderers.get(format) ?? renderers.get("text")
}
```

Keep real syntax faithful to the target language. Label illustrative code as pseudocode or `proposed` when it is not present in the evidence.

Check: syntax matches its language tag, omitted context does not change the apparent contract, and the block's evidence status is clear.

## Structural diffs

Use a `diff` block to explain a change to an existing component tree, file tree, call tree, state flow, or code shape. Retain enough unchanged context to locate additions and removals.

```diff
 <DashboardPage>
   <JobToolbar>
+    <RetryButton />
   <JobList>
+    <FailureReason />
```

```diff
 src/
 ├── intake/
+│   └── validate.ts      # rejects unsupported files
 ├── analysis/
-└── publish.ts
+└── delivery/
+    ├── publish.ts
+    └── notify.ts
```

```diff
 handleUpload
   validateFile
   persistBlob
+  enqueueAnalysis
-  respondAccepted
+  respondWithJobId
```

```diff
 on publish(report)
-  store report
+  if validation fails
+    return issues
+  store report
+  notify subscribers
```

The `+` and `-` lines represent the proposed delta; unchanged lines establish location and order. Use separate before/after visuals when a structural diff becomes harder to parse than two complete shapes.

Check: additions, removals, and unchanged context are all recognizable without prose, and applying the depicted delta produces the intended target shape.

## Text wireframe

Use a text wireframe for coarse spatial layout when fidelity and interaction are secondary.

```text
┌────────────────────────────────────────────┐
│ Analysis jobs                  [New upload] │
├──────────────┬─────────────────────────────┤
│ Job list     │ Selected job                │
│              │ [Progress] [Findings]       │
└──────────────┴─────────────────────────────┘
```

- Label regions, controls, repeated items, empty/loading/error states, and responsive rearrangement that matters.
- Keep box width consistent and avoid decorative detail.
- Switch to HTML when typography, responsive behavior, interaction, or visual state comparison carries the answer.

Check: the layout reads in the intended order in a monospaced block, every control has a text label, and the drawing remains intelligible without perfect box alignment.

## Render check

Preview the rendered response. Inspect table columns, fences, indentation, wrapping, special characters, and ordinary reading width. Split a dense visual rather than relying on horizontal scrolling or tiny text. If a preview is unavailable, report that rendering remains unchecked.
