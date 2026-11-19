# 0011. A shared component library: vendored shadcn/ui primitives, branded wrappers

- Status: Proposed
- Date: 2026-11-18

## Context

The web app and the MCP Apps views draw the same brand (`brand/README.md`)
twice: Tailwind utilities in `apps/web/src/shared/ui`, hand-written CSS and
HTML strings in `apps/mcp/src/modules/widgets/views`. Both should render the
same components. The MCP views run in a sandboxed iframe as one esbuild
bundle with inline CSS, so they cannot run a Tailwind build of their own, and
their types are checked with NodeNext resolution.

## Decision

`packages/ui` (`@deck-club/ui`) is a React component library built on
shadcn/ui (Radix, `radix-vega` style), Tailwind CSS v4 and Storybook.

- **`src/ui`** holds shadcn/ui primitives built on Radix UI, downloaded
  from the shadcn registry by the CLI (`pnpm ui:add`). The one rewrite:
  the registry imports `cn` from the `cn` package, which does not know the
  brand tokens, so `ui:add` points every primitive at `#lib/utils` instead.
  They are never edited by hand: `ui-lock.json` records their hashes and
  `pnpm lint` fails on drift. ESLint and Prettier skip them;
  `pnpm typecheck` does not (with `exactOptionalPropertyTypes` off in this
  package, which some registry files do not satisfy).
- **`src/components/<name>`** holds the branded components: source,
  `index.tsx`, a Vitest test and a story of every variant. Every change of
  look or behaviour happens here, never in `src/ui`. This is the public API:
  `@deck-club/ui/<name>`.
- **The theme** (`src/styles/theme.css`) maps shadcn's semantic tokens onto
  the brand tokens. The CLI writes the variables an item ships into
  `src/ui/shadcn.css`, which nothing imports, so it can never overwrite the
  brand.
- **Internal imports** are package subpath imports (`#ui/*`, `#lib/*`,
  `#components/*`). A `source` condition resolves them to `src/` inside the
  package (tsc, Vite, Vitest, Storybook); consumers resolve them to `dist/`.
  The CLI writes these aliases itself, so its output compiles unchanged.
- **The build** emits ES modules and declarations with `tsc` (TS 7), keeping
  each file's `"use client"`, plus a precompiled `dist/styles.css`.
  Tailwind consumers (web) import `@deck-club/ui/theme.css` into their own
  build; consumers without Tailwind (MCP views) inline `styles.css`.

## Consequences

One implementation of every component for both clients. Upgrading a
primitive is `pnpm ui:add <name> --overwrite` and a reviewed diff; branded
behaviour survives it because it lives outside `src/ui`. The library must
build before its consumers (turbo's `^build`). Relative imports in emitted
code end in `.js` (lint rule), because NodeNext consumers read the
declarations. `dark:` classes in primitives stay inert: the `dark` variant
is bound to a `.dark` class that is never rendered (light mode only).

## Alternatives considered

- Source-only ("just in time") package compiled by each consumer: the MCP
  views cannot compile Tailwind, and path aliases do not survive into a
  consumer's bundler.
- Editing shadcn components in place: every CLI upgrade would become a
  manual merge of brand changes.
- Vite library mode: bundling drops per-file `"use client"` directives, and
  declarations need a second tool.
