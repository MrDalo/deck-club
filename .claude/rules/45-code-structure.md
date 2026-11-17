---
description: Code-structure rule — names are glossary words, no single letters, size budgets, decomposition, no junk-drawer files, JSDoc on exports, the patterns already chosen. Loaded for any source file under apps/ or packages/.
paths:
  - 'apps/**'
  - 'packages/**'
---

# Code Structure

Where a number here is also an ESLint rule, the linter is the authority and
this file documents the intent. Budgets are smoke alarms: the fix is to name
the second job a function is doing, never to shave lines.

## Names

- **A name is a word, not a letter** (`id-length` min 2; `_` and next-intl's
  `t` excepted). `decks.map((deck) => …)`, never `(d) => …`.
- **Bindings carry the glossary noun**: `deck`, `card`, `provenance`,
  `review`. **Booleans read as assertions**: `isPending`, `hasFailed`,
  `canManageDeck`. **Functions are verb phrases**: `createDeck`,
  `applyCardPatch`, `formatDeckList`.
- **No invented abbreviations** (`dk`, `crd`, `cfg`, `btn`).
- Files are kebab-case and named for the one thing they hold:
  `deck-access.ts`, `use-card-editor.ts`. **Never** `utils.ts`,
  `helpers.ts`, `common.ts`, `misc.ts`, `shared.ts`.

## Size budgets (ESLint)

| Budget                | Limit                                                        |
| --------------------- | ------------------------------------------------------------ |
| Lines per function    | 80                                                           |
| Lines per file        | 400                                                          |
| Parameters            | 4 — more means a missing type (`CardRef`, `AddCardsRequest`) |
| Nesting depth         | 4                                                            |
| Cyclomatic complexity | 15                                                           |
| Nested ternaries      | none                                                         |

Tests are exempt from the line budgets, not from naming.

## Shape

- `type`, not `interface` (except declaration merging, with a comment).
  No `enum`: a `const` array or object `as const` and a derived union.
- Explicit return types on exported functions, hooks and components.
- **JSDoc on every export**: one line on what it is for; `@param name -
description` and `@returns` on functions with parameters; hooks describe
  the shape they return; props types comment each property.
- Prefer early returns over nested conditionals, named intermediate values
  over long inline expressions.
- No manual memoisation (`useMemo`, `useCallback`, `React.memo`) unless a
  measured problem says so.
- One component per file, except small private subcomponents used only by
  that file's export.
- DRY by the third copy, not the second; promotion is earned
  (`docs/frontend-structure.md`).
- Comments say **why**, never what the next line does.
