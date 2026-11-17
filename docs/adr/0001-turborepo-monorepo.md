# 0001. Turborepo + pnpm monorepo with shared config and contracts packages

- Status: Accepted
- Date: 2026-11-17

## Context

Three deployables (web, api, mcp) share validation, types and tooling. Spec 5
requires the UI and the AI to behave identically, which is easiest when they
share one schema source.

## Decision

One repository, pnpm workspaces with a version catalog, Turborepo for task
graphs and caching. `packages/contracts` holds every Zod schema;
`packages/config` holds ESLint (with architecture boundaries), tsconfig,
Prettier and Vitest presets. TypeScript 7 compiles and type-checks; 5.9 stays
for tools that need the JS API.

## Consequences

One PR can change a schema and all its consumers; CI runs every gate once.
Contracts changes have a wide blast radius, so they run every consumer's tests.

## Alternatives considered

Separate repositories (schema drift, versioning overhead); Nx (more machinery
than three apps need).
