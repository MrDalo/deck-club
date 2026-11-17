# Final implementation handoff

Render only the following structure after every outline phase has passed its
automated and human gates and all approved work is committed. Replace every
placeholder with the real value. Omit the ticket bullet when no ticket is known;
when its URL is unavailable, print the ticket identifier without a link. Use a
shared outline URL when one is available, otherwise use the repository-relative
outline path.

````markdown
### Status

- Implementation complete
- Ticket: [<TICKET-ID>](<ticket-url>)

### Next Steps

Begin pull-request preparation by invoking:

```text
$describe-pr
```

---

You can view the structure outline here: [<outline-filename>](<outline-permalink-or-path>)
````
