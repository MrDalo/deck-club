# 0002. NestJS modular monolith of hexagonal modules

- Status: Accepted
- Date: 2026-11-17

## Context

Spec 5: business rules live only in one core used by the web app, the MCP
server, realtime battles and background jobs. Spec 6 wants the SRS engine pure
and exhaustively testable. The product grows by bounded contexts (decks,
study, clubs, battles).

## Decision

`apps/api` is one NestJS process composed of modules under `src/modules`.
Each module is hexagonal: `domain/` (pure), `application/` (use cases and
ports), `infrastructure/` (Drizzle and in-memory adapters), `http/`
(controllers). Modules talk only through an async `<Module>Facade` returning
DTOs. ESLint boundaries enforce it.

## Consequences

Use cases are tested against in-memory adapters in milliseconds; a module can
be extracted into its own service without changing its callers. More files
per feature than a layered CRUD app.

## Alternatives considered

Microservices from day one (operational cost, against spec 11's free-tier
goal); a layered Nest app (rules leak into services and controllers).
