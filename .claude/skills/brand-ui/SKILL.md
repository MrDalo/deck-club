---
name: 'brand-ui'
description: 'Use when styling anything in apps/web or making a brand asset: the Deck Club palette (pastel, light mode only), type, the sticker buttons, the index-card and highlighter motifs, the shared UI components, and the accessibility floor. brand/README.md is the long form.'
---

# Brand and UI

Long form: [`brand/README.md`](../../../brand/README.md). Tokens:
`apps/web/src/app/globals.css`.

## Palette (light mode only — there is no dark theme)

| Token      | Hex       | Use                                             |
| ---------- | --------- | ----------------------------------------------- |
| `paper`    | `#faf8ff` | page background (lilac-tinted index-card paper) |
| `card`     | `#ffffff` | card and input surfaces                         |
| `ink`      | `#24203a` | all body text, borders, the sticker shadow      |
| `ink-soft` | `#5b5575` | secondary text (AA on paper and card)           |
| `line`     | `#e4def5` | ruled lines, dividers                           |
| `focus`    | `#6e56cf` | focus outline only                              |
| `lilac`    | `#cdbffb` | primary button, brand                           |
| `mint`     | `#bdebd6` | success, "Added by" badges, Good rating         |
| `peach`    | `#ffd3b8` | warnings, Hard rating                           |
| `rose`     | `#f9c2d1` | errors, danger button, Again rating             |
| `sky`      | `#c3e0fa` | the card editor, Easy rating, reversible badge  |
| `butter`   | `#fff0a8` | the highlighter swipe, notices                  |

Pastels are **fills only**; text on any of them is `ink`. Never a `dark:`
variant. Rating colours are fixed for the review screen (Again rose, Hard
peach, Good mint, Easy sky).

## Type

Display: Bricolage Grotesque (headings, deck titles, the wordmark), weight
700–800, tight tracking. Body: Atkinson Hyperlegible (chosen for legibility,
spec G5). Both via `next/font`, `latin-ext` for Slovak and Czech.

## Motifs

- **Index cards**: `.ruled` gives ruled lines with a rose margin rule; cards
  have 2px ink borders and `rounded-[var(--radius-card)]`.
- **Highlighter swipe**: `.highlight` on one heading per page (set
  `--highlight` to a deck's accent).
- **Stickers**: buttons and featured panels use `shadow-sticker` (hard offset,
  no blur); pressing flattens it.
- Spend boldness once per screen. Everything else stays quiet.

## Components (`src/shared/ui`)

`Button` (primary, secondary, danger, ghost; sm, md, lg; `asChild` for links),
`Input`, `Textarea`, `Select`, `Label`, `FieldError`, `Form`, `ErrorNotice`,
`LogoMark`. Add a new primitive here only if a second feature needs it.

## Floor

WCAG 2.2 AA contrast, 3px `focus` outline on `:focus-visible`, 44px touch
targets for primary actions, mobile-first layouts, `prefers-reduced-motion`
respected.
