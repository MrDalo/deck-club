# 0004. The MCP server is a separate, stateless client of the API

- Status: Accepted
- Date: 2026-11-17

## Context

Spec 9: the MCP server is a first-class client with the same validation,
limits and permissions as the web app. Spec 5: rules live only in the core.

## Decision

`apps/mcp` is its own NestJS service. It holds no data and no rules; each tool
calls the API over the private network with the user's bearer token and the
AI client's name. Streamable HTTP in stateless mode: one `McpServer` per
request, bound to that request's token. Refusals are tool results.

## Consequences

Parity with the UI is structural, not a discipline. The MCP server scales
horizontally and can be deployed on its own domain. One extra network hop per
tool call.

## Alternatives considered

An MCP module inside the API (shares a process and failure domain with the
core; tempts direct repository access).
