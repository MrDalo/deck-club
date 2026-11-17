# Research-question handoff

Return exactly one block and replace the link placeholder with the host-provided permalink or artifact path.

## Updated artifact

````markdown
### Next Steps

The research questions are updated and form the query plan for the research phase.

[View the updated research questions]({{host_permalink_or_artifact_path}})

The questions are inputs for the research phase; do not answer them in this handoff.

Continue with:

```text
$create-research
```
````

## Already satisfied

Use this block only when validation found that the artifact already satisfies every feedback item and the file remained byte-for-byte unchanged.

````markdown
### Next Steps

The existing research questions already satisfy the requested feedback and remain the query plan for the research phase.

[View the research questions]({{host_permalink_or_artifact_path}})

The questions are inputs for the research phase; do not answer them in this handoff.

Continue with:

```text
$create-research
```
````

## Blocked

Use this block when any validation check remains unresolved.

````markdown
### Research-question revision blocked

[Open the current research questions]({{host_permalink_or_artifact_path}})

The query plan is not ready for research because:

- {{failed check}}: {{missing evidence, decision, or repair}}

Provide the named input or ask me to continue investigating.
````

List every failed check. Do not include `$create-research` in this branch.
