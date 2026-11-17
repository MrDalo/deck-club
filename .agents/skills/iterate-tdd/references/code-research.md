# Code research and evidence

Read this reference when feedback concerns existing functionality, repository structure, implementation feasibility, established patterns, integration points, or file/signature accuracy.

## Start from the task evidence

Start from the task artifacts and user-named sources loaded by the main runbook. Use document precedence for decisions, but use the repository for claims about current code. A newer design choice can supersede an older requirement; it cannot invent current implementation behavior.

## Choose the smallest research pass that closes the claim

- **Locate:** find the concrete files, symbols, tests, schemas, endpoints, configuration, and owners involved.
- **Analyze:** trace current behavior, data/control flow, error paths, dependencies, and integration seams.
- **Pattern-match:** find analogous implementations that establish naming, layering, validation, testing, migration, or rollout conventions.

When agent delegation is available and the investigation is not already clear from context, delegate independent passes concurrently:

- `codebase-locator` for relevant files and symbols.
- `codebase-analyzer` for how a concrete subsystem works.
- `codebase-pattern-finder` for comparable implementations and conventions.

Give each agent a bounded question and require file-and-line evidence. If those roles are unavailable, perform the same passes with the repository's supported exploration tools. When the user asks how existing functionality works or asks for implementation detail, complete at least one evidence pass before editing the TDD.

## Evidence record

For every claim that can change the design, capture:

| Evidence | Record |
|---|---|
| Current behavior | Entrypoint and traced call/data path |
| Contract | Exact API/RPC/method/schema signature and compatibility constraints |
| Ownership | Component/module boundary and responsible file |
| Pattern | Comparable implementation and the convention it demonstrates |
| Failure behavior | Error source, propagation, retry/idempotency, and observable signal |
| Verification | Existing test level/fixture and the revised assertion needed |
| Delivery | Migration ordering, feature flag/config, compatibility window, rollback seam |

Use `path:line` citations and selective multiline snippets where they make the pattern verifiable. Check that cited paths and symbols still exist. Treat stale research as a hypothesis until the repository confirms it.

The research pass is complete when each active factual claim has direct evidence, a clearly labeled inference from evidence, or one precisely named missing fact. Return the missing fact to the interview loop instead of filling it with assumption.
