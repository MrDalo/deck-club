---
task: <task-directory>
type: structure-outline
repo: <current-repository>
branch: <current-branch>
sha: <git-rev-parse-head>
---

# <Implementation title>

<Two or three sentences describing the change, the governing approach, and the boundary of this outline.>

## Desired End State

- <Observable outcome or invariant>
- <Observable outcome or invariant>

## Implementation Overview

- [ ] Phase 1: <Outcome-oriented title>
- [ ] Phase 2: <Outcome-oriented title>

---

## Phase 1: <Outcome-oriented title>

<What becomes possible after this phase, why this is the first safe slice, and any compatibility boundary it preserves.>

### Change Outline

<Introduce the first view and say what relationship it establishes. Select only the views needed from `show-me.md`; the examples below demonstrate available notation rather than required sections.>

```diff
 path/to/shared/root/
 ├── existing-area/
+│   ├── new-module.ts          + owns the new behavior
+│   └── new-module.test.ts     + proves the behavior
 └── other-area/
-    ├── removed-file.ts
+    └── changed-file.ts        ~ delegates to the new owner
```

<Explain the contract or shape that connects the ownership view to behavior.>

```ts
interface TargetContract {
  id: string
  state: 'new' | 'ready'
}
```

<Explain a focused change to an existing boundary when needed.>

```diff
 PATCH /resources/:id
 request
   id: string
+  state: TargetContract['state']
 response
   resource: Resource
+    state: TargetContract['state']
```

### Validation

#### Automated Verification

- [ ] `<repository command>` — <specific behavior or invariant proved>
- [ ] `<focused test command>` — <specific regression boundary proved>

#### Manual Verification

- [ ] <Judgment-based observation that automation cannot prove>

<Omit Manual Verification when it adds no evidence.>

<If this phase has neither a user/system-visible outcome nor any meaningful human-observable effect, reconsider whether it is a complete vertical slice.>

---

## Phase 2: <Outcome-oriented title>

<Repeat the phase structure with only the views this phase needs.>

### Change Outline

<Concise narrative and selected target-shape views.>

### Validation

#### Automated Verification

- [ ] `<repository command>` — <claim proved>

---

## Open Questions

- <Decision still needed, evidence gathered, and effect on phase design>

<Omit this section when no questions remain.>
