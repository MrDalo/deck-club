# Artifact input contract

Load this reference during Step 1. Its rules define the complete evidence set
for a new plan.

## Resolve the task directory

Use the first applicable source:

1. An explicit `.agent-work/tasks/<task-slug>` directory supplied by the user.
2. The parent task directory of an explicitly supplied artifact path.
3. A task artifact directory named in the invocation or session context.

When a candidate is known, run `ls -La <task-directory>`. The uppercase `L`
follows a symlinked task directory; `-a` includes hidden entries. If no
candidate can be resolved unambiguously, ask for the directory or artifact path
before reading unrelated tasks.

## Build the evidence set

Read every readable task artifact to completion, including when present:

- the ticket or task statement;
- completed research;
- design discussion and decisions;
- product requirements;
- technical design;
- the approved structure outline;
- later user-feedback or decision artifacts;
- an earlier plan only when the user explicitly asks to supersede or build from
  it.

Research-question artifacts are discovery prompts for the research stage, not
planning evidence. Account for them in the directory inventory and exclude their
contents. Use the completed research artifact instead.

Follow relevant paths named by the artifacts into the repository during Step 2.
A task artifact is not evidence that a referenced file or example still matches
the checkout.

## Resolve conflicts

Use explicit user direction from the current invocation first. For artifact
conflicts, the more downstream approved artifact governs:

```text
current plan decisions
  > structure outline
  > technical design
  > product requirements or design discussion
  > completed research
  > ticket or task statement
```

Within one tier, use the later explicit decision, not whichever file happens to
be read last. The plan becomes the final implementation authority only after it
faithfully incorporates the governing decisions.

Repository state governs current mechanics—paths, APIs, scripts, types, and test
patterns. Artifact precedence governs intended behavior and accepted scope. When
these authorities conflict, preserve intent, update the mechanics to the current
repository, and document the discrepancy. Ask the user when resolving it would
change approved scope or product behavior.

**Contract complete when:** the directory inventory accounts for every entry;
all eligible artifacts have been read to their end; research-question artifacts
remain excluded; every conflict has a named governing source; and no unresolved
decision is silently invented.
