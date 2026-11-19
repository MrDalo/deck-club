# Architecture Decision Records

Format and process: the `adr` skill. Accepted ADRs are never edited except
their status line.

| ADR                                                | Title                                                                        | Status   |
| -------------------------------------------------- | ---------------------------------------------------------------------------- | -------- |
| [0001](0001-turborepo-monorepo.md)                 | Turborepo + pnpm monorepo with shared config and contracts packages          | Accepted |
| [0002](0002-modular-monolith-hexagonal-modules.md) | NestJS modular monolith of hexagonal modules                                 | Accepted |
| [0003](0003-sqlite-drizzle-libsql.md)              | SQLite through Drizzle and libSQL to start                                   | Accepted |
| [0004](0004-mcp-server-as-api-client.md)           | The MCP server is a separate, stateless client of the API                    | Accepted |
| [0005](0005-supabase-auth-and-private-api.md)      | Supabase Auth, JWKS verification, and a private API behind the web forwarder | Accepted |
| [0006](0006-next-intl.md)                          | next-intl for internationalisation                                           | Accepted |
| [0007](0007-fsrs-via-ts-fsrs.md)                   | FSRS through ts-fsrs, behind a scheduler port                                | Proposed |
| [0008](0008-mcp-sdk-v2-oauth-and-apps.md)          | MCP SDK v2 (stateless), Supabase as OAuth 2.1 server, MCP Apps views         | Accepted |
| [0009](0009-idempotency-keys-for-api-writes.md)    | Idempotency keys for API writes, in the shared kernel                        | Accepted |
| [0010](0010-club-decks-shared-by-link.md)          | Clubs share decks by link; the deck stays its author's                       | Accepted |
| [0011](0011-ui-component-library.md)               | A shared component library: vendored shadcn/ui primitives, branded wrappers  | Proposed |
