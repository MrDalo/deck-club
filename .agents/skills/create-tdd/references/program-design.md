# Program Design Reference

Read this reference only after System Design approval. Its completion bar is exhaustive: map every changed system boundary to a concrete code shape, account for each concern below, and consciously rule out inapplicable views.

## Coverage checklist

### Ownership and control flow

- Assign each responsibility to a module, package, class, function, component, or workflow consistent with the repository's existing boundaries.
- Trace the important runtime call path from each changed entry point through side effects and result handling.
- Show created, modified, moved, and retired files when their ownership is itself a design choice.
- Identify dependency-injection seams and explain what behavior each dependency enables.

### Internal contracts and behavior

- Define the key internal types, function signatures, component props/state, and interfaces that realize the approved system contracts.
- Sketch algorithms, state machines, concurrency controls, caching, batching, or error translation where the implementation shape is not obvious.
- Make error ownership, cancellation, retries, resource lifetime, and cleanup explicit where they affect code structure.
- Address performance, security, and observability concerns at the exact seam that implements them.

### Pattern fit and verification seams

- Cite reusable repository patterns with file locations and a short representative snippet under `Patterns to Follow`.
- Explain intentional deviations from those patterns as settled decisions.
- Identify test seams and observable outcomes sufficient to verify the design without enumerating every test file.
- Keep the view selective: the structure outline will turn this design into an exhaustive file-by-file change list.

## Questions compare code, not adjectives

Almost every program-design question should include a code block. Give each genuine alternative its own block so the user compares shapes directly, then explain the tradeoff and recommendation. Use the repository's language where possible.

## Choose the view that exposes the decision

### Call-stack tree

Use for orchestration in services, commands, workers, and background jobs. Include design-significant calls rather than every frame.

```text
exportCommand
  requestExport
    validateAccountAccess
    exportStore.createQueued
    exportQueue.publish
  renderReceipt
```

Use a `diff` only when changed and removed calls are the point:

```diff
 exportCommand
-  generateSynchronously
+  requestExport
+    exportQueue.publish
```

### Frontend component tree

Use for UI ownership, local state, data hooks, and package boundaries. Adapt the syntax to the codebase's framework.

```tsx
<ExportsPage> (apps/web/routes/exports.tsx)
  useExportsQuery()
  <ExportToolbar>
    <CreateExportDialog> (packages/ui)
      useExportForm()
```

Use a `diff` when changed components, props, or state are the decision.

### File-tree diff

Use for broad refactors or responsibility moves. Preserve tree depth and annotate why a file changes.

```diff
 src/export
+├── export-workflow.ts      # owns request orchestration
+├── export-worker.ts        # processes queued exports
~└── export-route.ts         # delegates to the workflow
```

### Dependency-injection map

Group dependencies under the receiver and state the capability each provides.

```text
requestExportWorkflow
  exportStore   -> persists lifecycle state
  exportQueue   -> schedules asynchronous generation
  clock         -> supplies deterministic timestamps

exportWorker
  objectStore   -> publishes the completed export
  telemetry     -> records duration and terminal state
```

### Internal signatures

Use for important functions or interfaces below the system boundary.

```text
reserveExportSlot(accountId: AccountId, now: Instant) -> Result<ExportLease, CapacityError>
```

### Pseudocode

Use English-like steps for algorithms and stateful behavior where real syntax would hide the design.

```text
on ExportRequested
  claim the queued export with a lease
  if another worker owns an unexpired lease
    acknowledge without work
  generate and upload the artifact
  mark ready with the object key
  on retryable failure, release or expire the lease
```

## Complex-concept branch

When code shape, data flow, and annotations need one integrated view, use the same HTML branch defined in [`system-design.md`](system-design.md). Read [`artifact_template.html`](artifact_template.html) before writing the focused artifact and link it beside the Program Design decision it explains.

The branch is complete when the HTML structure validates, its Markdown link resolves, and the integrated view communicates a relationship that the standard code-shape views cannot show as clearly.
