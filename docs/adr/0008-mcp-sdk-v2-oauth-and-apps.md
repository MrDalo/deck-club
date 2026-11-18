# 0008. MCP SDK v2 (stateless), Supabase as OAuth 2.1 authorization server, MCP Apps views

- Status: Accepted
- Date: 2026-11-17

## Context

Spec 9 asks for a remote MCP server that works in claude.ai, Claude Code,
ChatGPT and Codex, with OAuth 2.1 per the MCP authorization spec, scoped AI
connections, ready-made prompts and (spec 13) possibly interactive UI in the
chat. ADR 0004 made the server a stateless client of the API, and ADR 0005
left OAuth as "the next auth slice". The v1 `@modelcontextprotocol/sdk` was
superseded by the v2 packages, which implement the 2026-07-28 protocol
revision: stateless by design, with a per-request server factory
(`createMcpHandler`) and a stateless fallback for 2025-era clients.

## Decision

- **SDK v2, stateless.** `@modelcontextprotocol/server` with
  `createMcpHandler(factory, { legacy: 'stateless' })`, mounted in a Nest
  controller on Fastify through a small web `Request` bridge (Fastify sends
  the SDK's web `Response` natively). One factory serves both eras. The v1
  SDK, and the hono/express it brought, leave the dependency tree.
- **Supabase Auth is the authorization server; the MCP server is the
  resource server.** It serves RFC 9728 protected resource metadata naming
  the Supabase issuer, relays Supabase's RFC 8414 metadata for older clients,
  and answers unauthenticated requests with the SDK's
  `WWW-Authenticate … resource_metadata` challenge. Tokens are verified with
  `@supabase/supabase-js` `auth.getClaims` (signature against the project's
  JWKS, expiry), then the domain checks issuer, audience, user role and
  non-anonymous user. OAuth tokens carry `client_id`; web session tokens
  (the pasted token) pass the same checks.
- **Deck Club scopes are granted in Deck Club, enforced per tool.** Supabase
  issues only OpenID scopes, so scopes are not advertised to or requested
  from Supabase; `grantedScopes()` maps a principal to its grants (all, until
  AI connections store them), and each tool refuses with
  `REJECTED: FORBIDDEN` when its scope is missing, rather than an OAuth
  step-up the authorization server could not satisfy.
- **Modules contribute the surface.** Feature modules mark an adapter with
  `@McpFeature()` (and probes with `@HealthCheck()`); Nest's
  `DiscoveryService` collects them, so the transport never imports a feature.
- **MCP Apps** (`@modelcontextprotocol/ext-apps`) for in-chat views: `ui://`
  resources with the `text/html;profile=mcp-app` MIME type and a closed CSP,
  linked from tools through `_meta.ui.resourceUri`. HTML comes through a
  `WidgetViews` port; a placeholder adapter serves it until views are built.
- **Readiness** joins liveness: `GET /health/ready` runs every probe (API,
  Supabase metadata) with a timeout and answers 503 when one is down.

## Consequences

Any replica serves any request, and a request can only ever act as its own
token's user. The token the AI client sends is forwarded to the API, which
verifies it again: both services share Supabase's `authenticated` audience,
so this is not the cross-audience token passthrough the MCP spec forbids,
but it does mean the MCP server cannot narrow a token's audience. If
Supabase gains resource indicators, switch to audience-bound tokens. The
consent page Supabase redirects to must be built in the web app before the
OAuth flow completes end to end. The server depends on Supabase being
reachable for sign-in and key refresh, which readiness makes visible.

## Alternatives considered

Staying on SDK v1 (no 2026-07-28 support, session-shaped transport);
running our own authorization server (a security surface we do not need,
against ADR 0005); OAuth scope step-up via `requireScopes` (Supabase cannot
issue custom scopes, so clients would loop); a hand-written list of feature
modules in the transport (every new module would touch it).
