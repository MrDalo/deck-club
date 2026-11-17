# Follow-up research

Use follow-up research to close a planning gap, not to repeat completed research. A gap is consequential when its answer could change phase boundaries, ownership, an interface, migration order, backward compatibility, or verification.

## Foreground research roles

When subagents are available, dispatch the smallest matching foreground role and wait for its result before drafting the affected phase:

| Role | Use it to answer | Required return |
|---|---|---|
| `codebase-locator` | Where do the relevant files, symbols, tests, or configuration live? | Exact paths and why each is relevant |
| `codebase-analyzer` | How does a specific implementation or integration currently work? | Call/data flow, invariants, and cited source locations |
| `codebase-pattern-finder` | What established example should the change follow? | Comparable examples, similarities, and meaningful differences |
| `web-search-researcher` | What external API, standard, or current practice constrains the design? | Primary-source links, dates/versions, and implications for this repository |

Keep agents in the foreground so their findings are inspected before planning continues. If named roles are unavailable, perform the same bounded investigation directly. Parallelize independent gaps only; combine related questions into one investigation so evidence is not fragmented.

## Research prompt contract

Give each investigation:

- one explicit question;
- the task and repository context needed to answer it;
- exact known paths or symbols;
- the decision the answer will affect; and
- the required evidence format from the table above.

Inspect cited files and primary external sources yourself before adopting a conclusion. Reconcile disagreement between research results using source evidence and document precedence.

Follow-up research is complete when every consequential gap has an evidence-backed answer or a named open question that states the blocked decision and its effect on phase structure.
