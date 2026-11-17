# Final-response contract

Return the following handoff with every applicable value resolved. Omit the Ticket line when no ticket exists. Use a local path as plain code when the host provides no artifact permalink. Keep the answer concise, but report unresolved risks and failed checks explicitly.

### Status

- PR: [#{number} — {title}]({PR_URL}) (`{BASE_REF}` ← `{HEAD_REF}`)
- Description: {link `OUTPUT_PATH` to the optional host permalink, or show the local path as code}
- Walkthrough: {link `WALKTHROUGH_PATH` to the optional host permalink, show the local path as code, or say `Skipped — N changed lines across M files`}
- Ticket: [{TICKET_ID}]({TICKET_URL})

### Summary

{Two or three sentences covering the problem, shipped outcome, and the most important implementation decision.}

### Review map

- `{path or component}` — {why a reviewer should look here}
- {repeat for each material changed-file group}

### Verification

- `{command}` — {observed result}
- Walkthrough diff injection — {injected N/N files and validation result, when applicable}

### Plan alignment

{Implemented as planned, concise deviation summary, or `No plan file found.`}

### Risks or follow-up

{Unresolved risk, failed/skipped check, migration/rollout note, or `None.`}

The remote PR body matches the saved description.

When another installed skill is the clear next action, name it using the `$skill-name` form; otherwise end after the verified status.
