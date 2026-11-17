---
description: Contracts rules — packages/contracts is the single source of every Zod schema, DTO type, error code, header name and MCP tool input. Additive-forever codes and tool names. Loaded for files under packages/contracts.
paths:
  - 'packages/contracts/**'
---

# Contracts

`@deck-club/contracts` is what the web app, the API and the MCP server agree
on. It is the only place `zod` is imported at runtime (lint enforces it; the
one exemption is each app's `env.ts`).

- **One schema per boundary shape.** HTTP bodies and responses, MCP tool
  inputs, error bodies, the sign-in form. The web form, the API controller and
  the MCP tool parse with the same schema, so the UI and the AI can never
  validate differently (spec 5, 9).
- **Input and output types.** Export `XInput = z.input<…>` (what a client
  sends, defaults optional) and `XCommand = z.output<…>` (what a use case
  receives). DTOs (`Deck`, `Card`) are `z.infer`.
- **Limits live here** (`DECK_LIMITS`, `CARD_LIMITS`) and are referenced by
  the schema, the UI and the tool descriptions, never restated.
- **Plain text only.** Every free-text field goes through `plainText()`,
  which rejects markup (spec 9, 11).
- **Additive forever.** An `ERROR_CODES` entry, an `MCP_TOOL_NAMES` entry, a
  card type or an enum value is never renamed or repurposed: AI clients and
  old builds match on them. Deprecate by adding.
- **No logic beyond parsing.** No I/O, no clock, no business rule. A helper
  that every boundary needs identically (`parseBearerToken`) is allowed.
- **Field descriptions in tool inputs** are written for an AI reader
  (`mcp-tool-surface`).
- Every schema with a refinement, default or transform has a test.
- After a change, rebuild (`pnpm turbo run build --filter=@deck-club/contracts`)
  and run **every consumer's tests** — the blast-radius rule in
  `verification-gates`.
