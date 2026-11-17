---
name: 'security-baseline'
description: 'Use when touching auth, tokens, the web forwarder, the MCP endpoint, user input, rendering of user content, redirects, environment variables, Docker or CI. The patterns already chosen and the regression list every such change walks.'
---

# Security baseline

## Patterns already chosen

- **Supabase Auth, magic link** (spec 10). The web app uses `@supabase/ssr`
  cookie sessions; the proxy refreshes them. Pages verify with
  `supabase.auth.getUser()`, never trusting the cookie alone.
- **The API verifies every token** against the project's JWKS
  (`SupabaseJwksVerifier`: issuer `<url>/auth/v1`, audience `authenticated`,
  5 s timeout). No shared JWT secret anywhere.
- **The API is private.** Only `web` and `mcp` publish ports, on 127.0.0.1.
  The browser reaches the API only through `/api/v1/*`, which forwards an
  allowlisted path with the session token.
- **Authorization in use cases.** Ownership is checked in
  `loadManagedDeck`-style helpers; others' resources answer `*_NOT_FOUND`.
- **The MCP server** builds a fresh server per request bound to that
  request's token, stores no tokens (the client-name registry keys on a
  SHA-256 digest), and never mixes users.
- **Plain text everywhere.** Contracts reject markup; React escapes output;
  `dangerouslySetInnerHTML` is banned (hook + review).
- **Secrets** only in the root `.env` (git-ignored, denied to Claude by
  settings) or the deploy environment. The web app only ever holds the
  publishable key. Images never receive secrets as build args.

## Regression list (walk it for every relevant change)

- [ ] Every new API route except `/health` has `@UseGuards(AuthGuard)`.
- [ ] The user id comes from `@CurrentUser()`, never from the request body.
- [ ] Every boundary input is parsed with a contracts schema.
- [ ] A new top-level resource in the forwarder allowlist is intended to be
      browser-reachable.
- [ ] No secret, service-role key or token in code, logs, `NEXT_PUBLIC_*`,
      test fixtures or Docker layers.
- [ ] Redirect targets go through `safeRedirectPath`.
- [ ] Outbound calls have timeouts.
- [ ] Errors to clients carry codes and safe details only (the filter hides
      unknown errors).
- [ ] New dependencies: maintained, licence compatible, no install script
      unless added to `onlyBuiltDependencies` on purpose.
