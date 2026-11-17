---
name: 'dogfood-run'
description: 'Use to prove an MCP tool works from an AI assistant''s seat: run the stack, connect a real MCP client with a real access token, perform the use case end to end, and save the transcript for learner-advocate. Trigger phrases: "dogfood", "try it from Claude", "end-to-end MCP check".'
---

# Dogfood run

1. Start the stack: `pnpm dev` (or `pnpm stack:up`). Sign in on the web app.
2. On **Connect your AI**, copy the access token (valid one hour).
3. Connect a client, e.g. Claude Code:
   `claude mcp add --transport http deck-club http://localhost:4100/mcp --header "Authorization: Bearer <token>"`
   (or the MCP Inspector: `npx @modelcontextprotocol/inspector`).
4. Run the use case from the spec in natural language, e.g. spec 4.3: "Make 20
   cards from this article and add them to a new deck called Biology."
5. Check the result in the web app: cards present, "Added by <client>" badges,
   counts right.
6. Save the transcript to `.agent-work/dogfood/<date>-<tool>.md` (git-ignored)
   and hand it to `learner-advocate`.

Never paste a real token into a committed file or a log.
