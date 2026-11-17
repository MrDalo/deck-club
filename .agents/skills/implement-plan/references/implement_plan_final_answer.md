# Final implementation handoff

Use this structure only after the plan-level completion criteria in `SKILL.md`
hold. Replace every placeholder, omit parenthetical instructions, and omit an
optional line when its value is unavailable.

````markdown
### Summary

- <Outcome delivered across the completed phases>
- <Second material outcome, when useful>

### Status

- Implementation complete
- Plan: [<plan filename>](<artifact permalink when available; otherwise local path>)
- Ticket: [<ticket identifier>](<ticket URL>) <!-- optional -->
- Branch: `<branch>`
- Checkpoints: <commit hash list, or "changes intentionally left uncommitted">

### Verification

- `<command or manual check>` — passed
- <accepted failure or skipped check and its disposition> <!-- only when present -->

### Deviations

- None
<!-- Replace "None" with one bullet per material deviation when present. -->

### Next step

Create the pull-request description with:

```text
$describe-pr
```
````

Keep the summary outcome-focused. Verification reports commands and confirmed
manual checks rather than generic claims. A local plan link may be plain text if
the host cannot render workspace file links.
