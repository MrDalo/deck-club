# Research Revision Handoff

Select exactly one response after the validation audit. Replace every
brace-delimited field, omit inapplicable conditional blocks, and preserve the
chosen branch's order.

## Completed revision

Use this branch only after every validation check passes.

````markdown
## Next Steps

The research revision is complete: [`{artifact filename}`]({artifact path or optional host permalink}).

Review the revised evidence and open questions whenever you want a final
content check before design begins.

{When open questions remain:}
There are {N} open questions that you should review. You can:

- ask me to investigate them;
- provide the answers;
- tell me they are irrelevant and I'll remove them.

{When comment actions were requested:}
I also {replied to/resolved/deleted} {N} artifact comments as requested.

If you want to continue to design, invoke:

```text
$create-design-discussion
```

---

{When the host provided an artifact permalink:}
You can view the artifact [on the web]({host permalink}).

{Otherwise:}
The revised artifact is available at `{local artifact path}`.
````

Count only unresolved entries in the artifact's final Open Questions section. Use a host permalink
only when the current environment provides one; a guessed or placeholder URL is not a link.

## Blocked revision

Use this branch whenever one or more validation checks still fail.

````markdown
## Research revision blocked

The draft remains available at [`{artifact filename}`]({artifact path or optional host permalink}),
but the revision is not complete.

Unresolved validation items:

- {failed check}: {specific missing evidence, decision, or repair}

Provide the named evidence or decision, or ask me to continue investigating.
````

List every failed check. Do not include `$create-design-discussion` in a blocked
response.
