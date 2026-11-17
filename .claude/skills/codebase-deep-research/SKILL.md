---
name: codebase-deep-research
description: Deep multi-agent investigation of the current local codebase. Use when Codex needs an evidence-backed understanding of repository architecture, a subsystem, a code path, package or module boundaries, build or runtime wiring, change impact, or competing implementations inside the repo before making edits. Trigger on requests like "research this codebase", "how does this repo work", "trace feature X", "explain this architecture", "map this subsystem", or "what files are involved in this behavior".
---

# Codebase Deep Research

Use this skill to build a high-confidence understanding of the repository in the current working directory. Research the codebase from multiple angles in parallel, verify the important claims against primary evidence, and return a structured explanation with exact file references.

## Scope First

1. Determine the repository boundary.
- Run `git rev-parse --show-toplevel 2>/dev/null || pwd`.
- Run `git rev-parse --abbrev-ref HEAD 2>/dev/null`.
- Treat that repository as the scope unless the user explicitly widens it.

2. Define the research target.
- If the user names a subsystem, feature, bug path, workflow, symbol, or directory, use that as the anchor.
- If the request is broad, default to:
  - top-level architecture
  - build and test entrypoints
  - main runtime entrypoints
  - major packages or modules
  - notable extension points and risky areas

3. State the working frame before going deep.
- Say which question you are answering.
- Say which directories, packages, or services are in scope.
- Say whether the goal is architecture mapping, behavior tracing, comparison, or handoff preparation.

## Start Local, Then Fan Out

Establish a baseline yourself before spawning agents:

- Read the highest-value root files first: `README*`, package manifests, workspace config, build config, lint and test config, and top-level docs.
- Use `rg --files` to map the repository quickly.
- Use focused `rg` searches to find entrypoints, exported APIs, env vars, feature flags, tests, and target symbols.
- Prefer primary evidence over assumptions: source files, tests, configs, generated types, and recent git history.

Do not stop after the first scan. Use that baseline to decide what parallel questions need answers.

## Research Angles

Cover at least 3 angles for any non-trivial request.

| Angle | Questions to answer | Primary evidence |
|---|---|---|
| Structure | How is the repo organized? Which packages or modules matter? | manifests, workspace files, directory tree, README |
| Entrypoints | Where does execution start? What invokes the target flow? | CLI or server boot files, routes, schedulers, framework conventions |
| Data and control flow | How does state, input, or work move through the system? | imports, function calls, reducers, handlers, adapters |
| Contracts | What are the external and internal interfaces? | types, schemas, API clients, env vars, config |
| Validation | What proves expected behavior? | tests, fixtures, snapshots, assertions |
| History | Why is it this way? What changed recently? | `git log`, docs, ADRs, comments, TODOs |

For broad architecture requests, cover `structure`, `entrypoints`, `contracts`, and `history`.

For targeted tracing requests, cover `entrypoints`, `data and control flow`, `validation`, and `history`.

## Subagent Strategy

Prefer `explorer` subagents for read-only codebase research. Use multiple subagents for disjoint questions, not duplicate summaries.

Before spawning, sketch the investigation graph for yourself:

- goal
- first-wave lanes
- ownership for each lane
- merge points
- what evidence each lane must return

Recommended first wave for a medium or large repository:

1. Architecture explorer
- Own repo structure, packages, entrypoints, and build or runtime map.

2. Target-flow explorer
- Own the specific subsystem, symbol, or workflow the user cares about.

3. Validation and history explorer
- Own tests, docs, recent commits, and known edge cases for that area.

4. Cross-check explorer
- Own contradictions, alternate code paths, feature flags, generated code, or configuration branches.

Prompt each subagent with a crisp contract:

- exact question
- exact directories or files to prioritize
- read-only expectation
- required file references
- unanswered questions to surface
- no generic recap of the whole repository

Example handoffs:

- `Architecture explorer: Map the monorepo packages, build entrypoints, and runtime entrypoints. Cite exact files and explain how requests or jobs begin.`
- `Target-flow explorer: Trace feature X from inbound trigger to output or storage. Name the main functions, types, and branch conditions with file refs.`
- `Validation and history explorer: Find tests, docs, and recent commits that confirm or complicate the current behavior of feature X.`
- `Cross-check explorer: Identify alternate paths, feature flags, environment-specific code, or generated artifacts that could change the explanation.`

Use `worker` or `fast-coder` only when a bounded helper artifact would materially improve the research, such as:

- generating a quick dependency inventory
- running a focused repro script
- extracting a list of matches for a symbol family

Keep those tasks read-only unless the user also asked for code changes.

## Deepen the Investigation

After the first wave returns:

1. Read the key files yourself.
- Do not rely solely on subagent summaries.
- Open the concrete files they cite and verify the important claims.

2. Resolve gaps with targeted follow-ups.
- Spawn a second wave only for unanswered questions or contradictions.
- Narrow the scope each time: one path, one package, one interface, one ambiguity.

3. Cross-check behavior from multiple sources.
- Match implementation claims against tests and config.
- Match runtime explanations against framework conventions and actual call sites.
- Use `git log -- <path>` or `git blame` when history matters.

## Hypothesis Discipline

When behavior is ambiguous, state 1 to 3 concrete hypotheses and work them down with evidence.

- Label each one as `CONFIRMED`, `REJECTED`, or `UNRESOLVED`.
- Tie each verdict to files, tests, config, or history.
- Prefer a smaller set of sharp hypotheses over a vague list of possibilities.
- Leave a hypothesis `UNRESOLVED` if the codebase does not support a stronger claim.

## Output

Return a compact research report with:

- Scope: repo root, branch, target question, and assumptions
- Executive summary: the answer in 3 to 6 sentences
- System map: key modules or packages and how they relate
- Trace: the relevant flow from entrypoint to effect
- Evidence: exact file references for the main claims
- Impact surface: likely callers, dependencies, configs, and tests affected by edits in this area
- Variants and edge cases: feature flags, alternate paths, env-specific behavior, generated code, or version boundaries
- Hypotheses: any `CONFIRMED`, `REJECTED`, or `UNRESOLVED` behavior questions that mattered
- Confidence and open questions: what is verified, inferred, or still uncertain
- Next steps: only if useful, such as where to edit, what to test, or what to verify next

Prefer file references over long code quotes. Distinguish direct evidence from inference.

## Guardrails

- Stay inside the current local codebase unless the user explicitly asks for external research.
- Do not answer from a quick skim when the request needs a trace across multiple files.
- Do not delegate the final synthesis; keep dedupe, contradiction handling, and confidence scoring local.
- Do not spawn multiple subagents onto the same vague question.
- Do not turn this into implementation work unless the user asks for changes.
- If the repo is huge, narrow the question instead of pretending to understand everything.
- If evidence conflicts, say so plainly and cite both sides.
- Use `$recent-work-context` separately when the user wants prior Codex session state rather than code behavior.
- Use `$debugger-mode` separately when the answer depends on runtime repro, instrumentation, or live evidence.

## Default Depth

If the user says only "research this codebase," produce:

1. Repository shape and major packages or modules.
2. Build, test, and local development entrypoints.
3. Main runtime entrypoints.
4. One representative end-to-end flow.
5. Important contracts and configuration.
6. Highest-risk or least-obvious areas worth knowing before editing.
