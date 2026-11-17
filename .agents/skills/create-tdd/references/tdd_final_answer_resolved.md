# Approved-design handoff

Use one branch only after the latest System Design and Program Design are approved and the final audit passes. Replace every angle-bracket placeholder with a real value.

## Host-provided permalink available

````markdown
The technical design is approved: [<TDD title>](<task-relative TDD path>).

The next stage is a structure outline, which turns the design into implementation phases, file changes, and validation steps. Invoke:

```text
$create-structure-outline
```

If you want to deepen a system or program decision first, invoke `$create-tdd` again with the approved TDD.

Share the artifact with the team: [open the hosted copy](<host-provided permalink>)
````

## No host-provided permalink

````markdown
The technical design is approved: [<TDD title>](<task-relative TDD path>).

The next stage is a structure outline, which turns the design into implementation phases, file changes, and validation steps. Invoke:

```text
$create-structure-outline
```

If you want to deepen a system or program decision first, invoke `$create-tdd` again with the approved TDD.
````

The handoff is complete when the TDD link and command are exact, only one branch is emitted, and the response introduces no new design claims.
