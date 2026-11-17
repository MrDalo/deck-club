# Research protocol

This reference controls inquiry resolution, research modes, evidence collection, delegation, and
artifact handling for `create-research`.

## Inquiry resolution

Inputs have this order of authority:

1. The user's explicit question, scope, and directly named files.
2. A selected `*research-questions*.md` file from the task artifact directory supplied by the
   system.
3. Clarification requested from the user when neither source yields one inquiry.

When the system supplies a task artifact directory, substitute its literal path in
`ls -La -- '/path/from-system/'`. The trailing slash follows a directory symlink; `-a` exposes all
candidate files. Select candidates by basename without scanning file contents.

- One matching research-questions file: read it in full and incorporate it unless the user
  explicitly scoped the run to a different query.
- Several matching files: list their names, ask which one controls this run, and read none until the
  user selects one.
- No match and no explicit query: ask, "What codebase question or area should I map? I'll trace its
  implementation, tests, and connections."

The task directory has a protected-file boundary. Read `ticket.md`, `task.md`, and any nonmatching
artifact only when the user explicitly names that file as an input. This keeps feature intent from
being mistaken for current repository behavior.

Every file the user names directly—including documentation, structured data, and a selected
question artifact—is read from beginning to end by the main agent before any delegation. The main
agent owns the decomposition; subagents receive the resulting scopes rather than a partial input.

## Research modes

Use every mode required by the inquiry; a run may combine them.

| Mode | Use it for | Evidence returned |
|---|---|---|
| Location | Discovering the files, symbols, entry points, configuration, and ownership boundaries that comprise an area | Candidate map with paths and the reason each candidate matters |
| Mechanism | Tracing how a component behaves, including calls, state transitions, data flow, persistence, errors, and integration boundaries | Cohesive behavior trace with line-range citations |
| Pattern | Finding representative and counterexamples of a convention or repeated implementation | Compared examples, scope searched, and variance between them |
| Test | Establishing how each researched component is verified | Test paths, level, harness, mocks/fixtures, assertions, and explicit absence when none is found |
| Dependency | Explaining behavior owned by a library, framework, service, protocol, or standard | Installed version evidence plus authoritative documentation links |
| Web | Answering an authorized question whose evidence is outside the repository | Direct links, access/publication date when relevant, and a clear boundary between source fact and inference |
| Follow-up | Extending or correcting a completed research artifact | Updated sections, coverage table, references, and open-question count in the original artifact |

Location work normally precedes mechanism and pattern work that depends on its map. Independent
areas run concurrently. Test research accompanies every mechanism or component area rather than
being deferred to a repository-wide afterthought.

## Coverage ledger

Create one row for every original question before dispatch. A row is complete only when it has:

- the cohesive repository or external area to inspect;
- the evidence needed to answer the question;
- the test evidence needed for each component in that answer;
- an owner or an explicit local-execution marker;
- a final state of `answered` or `open: <missing evidence and impact>`.

Several questions that touch one area belong in one investigation. One question spanning unrelated
areas belongs in several. As a sizing heuristic, use two to six focused investigations for a
decomposable inquiry; a narrow question may need one. The ledger, not a fixed agent count, determines
exhaustiveness.

## Investigator selection and fallback

Use specialized roles when the host exposes them:

- `codebase-locator` for Location mode;
- `codebase-analyzer` for Mechanism and Test modes;
- `codebase-pattern-finder` for Pattern mode;
- `web-search-researcher` for Dependency and Web modes.

If the host provides a dedicated library-research capability, prefer it for in-scope library and
dependency questions. If it is absent, continue with the web researcher or authoritative
documentation and do not call attention to the missing optional capability.

Where named roles are unavailable but generic subagents exist, assign generic agents the same
bounded modes. Where delegation itself is unavailable, execute the ledger serially in the main
context. These fallbacks preserve the evidence contract and completion criteria.

Prompts name the question subset, repository boundary, expected evidence, required test coverage,
and response shape. They keep the investigator read-only. For external work, they require direct
links. They describe the research target rather than prescribing search mechanics the investigator
already owns.

Dispatch independent scopes together. Dispatch analysis that requires a location map only after
that map returns. Wait for every dispatched investigator before synthesis.

## Evidence contract

The researched checkout is the primary source of truth for repository behavior. Give sources this
precedence:

1. Current implementation, configuration, schemas, generated interfaces, and tests at the recorded
   commit.
2. Repository-owned architectural records and documentation, checked against implementation.
3. Official documentation for the installed dependency or external service version.
4. Broader web sources when the question authorizes them and stronger evidence is unavailable.

Every material repository claim carries `path:line` or `path:start-end`. Adjacent facts from one
span share one range. Every external claim carries a descriptive Markdown link to the direct source.
Record a mismatch between sources as conflicting evidence. Label deductions as inference and state
the evidence that supports them.

For each researched component, identify its unit, integration, and end-to-end evidence where
applicable; test harnesses; mocks and fixtures; shared test utilities; and behaviors asserted. When
no tests are found, record the boundary and search used so absence is a reproducible finding.

## Artifact destination and metadata

Task research lives at:

```text
.agent-work/tasks/TASKNAME/NN-research-DESCRIPTION.md
```

Resolve the destination in this order:

1. Use the task directory given by the system prompt.
2. If the inquiry includes a ticket identifier, inspect `.agent-work/tasks/` for a matching task
   directory. Use the single match, ask when several directories plausibly match, and create
   `TICKET-short-slug` when none exists.
3. Without a ticket identifier, use or create a short kebab-case task directory derived from the
   inquiry.

Within the chosen directory, list all entries with `ls -La`, find every numeric filename prefix,
and choose one greater than the highest, formatted with at least two digits. Use `01` when none
exists. The description is a two- to four-word kebab-case summary. Examples:

```text
.agent-work/tasks/ENG-1478-parent-child-tracking/02-research-parent-child-tracking.md
.agent-work/tasks/authentication-flow/02-research-auth-flow.md
```

Collect the current ISO-8601 time with timezone, commit SHA, branch name, and repository name before
writing. The template's placeholders are instructions and never appear in the finished artifact.

## Permalinks

Capture an artifact link when the host provides one during a write or edit. Preserve the newest link
for the final answer.

Create GitHub source permalinks only when the remote is GitHub and the researched commit is reachable
from a pushed branch. Resolve the repository owner and name from `gh repo view --json owner,name`,
and use the full commit SHA:

```text
https://github.com/OWNER/REPOSITORY/blob/COMMIT/path/to/file#L10-L24
```

When the commit is local-only, use artifact-local `path:line-range` citations rather than links that
would resolve to nothing.

## Closure and follow-up

After the first complete artifact exists, unresolved ledger rows may trigger one targeted follow-up
wave. Update the relevant narrative, question-coverage row, code references, and open-question list
in place. If the pass still cannot resolve a row, preserve the exact missing evidence and impact.

Later user questions about the same inquiry use Follow-up mode. Amend the original sections and
metadata as needed; preserve one coherent explanation and one authoritative open-question list.
