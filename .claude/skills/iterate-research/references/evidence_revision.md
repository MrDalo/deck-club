# Evidence Revision

Read this reference for corrections, challenged claims, follow-up questions, source refreshes, and
scope changes that affect factual content.

## Keep research observational by default

Describe what the codebase contains, where behavior lives, how control and data flow, how components
interact, and how the behavior is tested. Root-cause analysis, critique, recommendations, future
design, and optimization belong only to a scope the user explicitly requested; label that scope so
it cannot be mistaken for current-state evidence.

## Pin the researched snapshot

Before refreshing claims, record the repository identity, current branch, commit SHA, and working-tree
state. A dirty tree is evidence too: distinguish committed lines from local modifications when the
difference affects a finding. Re-check the paths and line numbers behind every affected claim against
this snapshot.

For a pushed commit, prefer an immutable, provider-native repository permalink
that pins the commit, file path, and relevant line. Keep local `path:line`
citations when no durable remote target exists. Never manufacture a permalink
for unpushed content.

## Use a source hierarchy

| Claim | Primary evidence | Corroborating evidence |
| --- | --- | --- |
| Current runtime behavior | Executable source, configuration, schemas, generated wiring | Tests, logs supplied in scope, runtime documentation |
| Entry points and ownership | Imports, registrations, routes, manifests, package boundaries | Directory layout and maintainer documentation |
| Data and control flow | Call sites, callees, message contracts, persistence code | Integration tests and fixtures |
| Why or when behavior changed | Git history, ADRs, design documents, commit or PR discussion | Current comments and naming conventions |
| Dependency behavior | The pinned dependency version and its authoritative documentation/source | Release notes and maintained examples |

User feedback defines the question and may identify a suspected correction; it becomes a factual
claim only after evidence supports it. Generated files, feature flags, platform branches, migrations,
error paths, and tests can expose alternate behavior, so include them wherever they affect the answer.

## Refresh repository evidence

1. Map each factual ledger item to the claims and citations it can affect.
2. Read every user-mentioned source file fully in the main context before delegation.
3. Use `codebase-locator` to inventory where unfamiliar components, tests, configs, and docs live.
4. Use `codebase-analyzer` to trace implementation, data flow, error paths, and boundaries.
5. Use `codebase-pattern-finder` to establish actual conventions and variations with concrete examples.
6. Run independent questions in parallel; sequence locator work ahead of analysis when the analysis
   target is not known. Ask for exact paths, line ranges, scope limits, and evidence—not opinions.
7. Wait for every subagent, then inspect enough primary evidence to confirm that each citation and
   conclusion survived synthesis. Keep final deduplication and contradiction resolution local.
8. Dispatch one focused follow-up wave only for remaining gaps or contradictions. Unresolved items
   become explicit open questions rather than guesses.

When a named specialist is unavailable, use the closest read-only code exploration agent while
preserving the same bounded responsibility and evidence format.

The refresh is exhaustive for the affected scope when every relevant entry point, alternate path,
configuration branch, boundary contract, and testing pattern is either documented or explicitly
excluded with a reason.

## Refresh web evidence only on explicit request

Use `web-search-researcher` (or the closest available web-research capability) only when the user
explicitly asks for external research, dependency documentation, or a web-source refresh. Give each
researcher a narrow question and require direct links.

Prefer primary sources: official documentation, the dependency's source repository, specifications,
release notes, and original research. Record the applicable product/library version and source date
or access date when currency matters. Attribute source statements separately from the document's
inferences. Keep conflicting authoritative sources when version, deployment, or publication date can
explain the difference; otherwise leave the conflict visible.

## Reconcile contradictions without erasing provenance

For each disagreement, identify whether it is caused by snapshot time, version, configuration,
platform, alternate code path, terminology, or a genuinely unresolved source conflict.

- Current executable evidence governs claims about the researched snapshot unless stronger runtime
  evidence in scope demonstrates otherwise.
- A stale statement is replaced in the narrative, while a concise note records the former claim,
  the new evidence, and the boundary that changed when that history matters to readers.
- Two simultaneously valid behaviors remain separate, each with its activation conditions and
  citations.
- An inference is labeled as inference and kept distinct from a directly observed fact.
- A contradiction that cannot be resolved becomes a precise open question naming the missing
  evidence needed to answer it.

After reconciliation, every changed conclusion must be traceable to the evidence that changed it;
no contradiction may disappear solely because one source was easier to cite.
