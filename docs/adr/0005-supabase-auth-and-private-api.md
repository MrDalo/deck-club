# 0005. Supabase Auth, JWKS verification, and a private API behind the web forwarder

- Status: Accepted
- Date: 2026-11-17

## Context

Spec 10: magic link and OAuth sign-in, no passwords to store. Spec 11:
server-side authorization on every request.

## Decision

Supabase Auth issues sessions. The web app keeps them in `@supabase/ssr`
cookies and forwards `/api/v1/*` to the API with the access token. The API
verifies every token against the project's published JWKS (issuer and
audience checked); there is no shared JWT secret. In Docker the API publishes
no port. The MCP server sends the user's token as a bearer (OAuth 2.1 per the
MCP authorization spec is the next auth slice).

## Consequences

No password storage, no session table, no secret on the API. The browser
never talks to the API directly. Supabase becomes a runtime dependency for
sign-in and key fetches.

## Alternatives considered

Auth.js in the web app (the API would need its own verification story);
self-built auth (security surface we do not need).
