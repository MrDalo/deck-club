# Resolved design-discussion handoff

Use this branch only when the saved artifact contains no open design questions,
every resolved question records an explicit user decision, and no revision
input remains open. Replace every bracketed field; omit the permalink sentence
when none was returned.

````markdown
## Design discussion resolved

[Open the resolved design discussion]([artifact permalink]).

Local artifact: `[local artifact path]`

All design questions are resolved. The next phase is to turn the design into a
structure outline of independently implementable work.

Invoke:

```text
$create-structure-outline
```
````

Return only the rendered handoff, with no additional summary.
