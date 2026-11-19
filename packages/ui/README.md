# @deck-club/ui

Deck Club's component library: [shadcn/ui](https://ui.shadcn.com) primitives
wrapped into branded components in the pastel brand theme (`brand/README.md`),
for the web app and the MCP Apps views. Decision record:
[ADR 0011](../../docs/adr/0011-ui-component-library.md).

Stack: React 19, shadcn/ui (Radix, `radix-vega`), Tailwind CSS v4,
Storybook 10, Vitest + Testing Library, TypeScript, ESLint, Prettier, knip.

## Layout

```
src/
  ui/                  shadcn/ui primitives, vendored. NEVER edited by hand.
    hooks/             their hooks (use-mobile, for the sidebar)
    shadcn.css         CSS variables the CLI writes; not imported (see Theme)
  components/<name>/   branded components, the public API
  lib/utils.ts         cn(): clsx + tailwind-merge that knows the brand tokens
  styles/theme.css     brand tokens → shadcn semantic tokens (Tailwind v4)
  styles/globals.css   entry of the precompiled dist/styles.css
  foundations/         Storybook docs (palette, type, motifs) and the
                       catalogue of every primitive, with its test
```

## What is in src/ui

53 shadcn/ui primitives. Radix UI (`radix-ui`) under most, lucide icons,
`class-variance-authority`, and their own engines where shadcn uses one:
react-day-picker (calendar), embla (carousel), recharts (chart), cmdk
(command), vaul (drawer), input-otp (input-otp), react-resizable-panels
(resizable), sonner (sonner):

accordion · alert · alert-dialog · aspect-ratio · avatar · badge · breadcrumb ·
button · button-group · calendar · card · carousel · chart · checkbox ·
collapsible · command · context-menu · dialog · drawer · dropdown-menu ·
empty · field · hover-card · input · input-group · input-otp · item · kbd ·
label · menubar · native-select · navigation-menu · pagination · popover ·
progress · radio-group · resizable · scroll-area · select · separator · sheet ·
sidebar · skeleton · slider · sonner · spinner · switch · table · tabs ·
textarea · toggle · toggle-group · tooltip

**Provenance.** Every file is downloaded from the shadcn registry
(`radix-vega` style) by `pnpm ui:add`, as the CLI writes it, with one
rewrite: the registry imports `cn` from the `cn` package, which only knows
Tailwind's default scales, so `ui:add` points each primitive at the
brand-aware `cn()` in `#lib/utils` and leaves the package out. Where the
registry's behaviour falls short, the branded component makes up for it,
never the primitive:

- `Progress` keeps `value` for its indicator and never hands it to Radix;
  the branded `Progress` (and `Attachment`) spread `progressAttributes()`
  (`#lib/progress-attributes`) so the bar announces its value.
- `Tooltip` no longer brings its own provider; the branded `Tooltip` does.
- `AlertDialogAction` and `AlertDialogCancel` wrap themselves in shadcn's
  `Button`, whose classes would be joined with the brand's; the branded ones
  put Radix's `Action`/`Cancel` around the branded `Button` instead.
- `NativeSelect` puts `className` on its wrapper; the branded one styles the
  `<select>` through `[&>select]:` classes.
- `sonner` reads the theme from `next-themes`, which Deck Club does not
  provide, so it falls back to `system`; the branded `Toaster` sets the theme.

Some primitives (`calendar`, `sonner`) do not type-check under
`exactOptionalPropertyTypes`, so `tsconfig.json` turns that flag off for this
package only.

Not included yet: form (react-hook-form).

Every primitive is in Storybook under **Foundations/Primitives**, and
`src/foundations/primitives.test.tsx` renders and drives them.

### Gaps the branded components close

Found by axe and by looking, in the primitives as shadcn designs them, and
where the branded layer stands on each:

| Gap in the primitive                                                                            | Branded fix                                                                                           | Status |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------ |
| Lilac used as text (`Button` `link`, 1.6:1 on Paper)                                            | Button's `link` is Ink with an underline                                                              | Done   |
| State shown in Lilac alone, about 1.6:1 (WCAG 1.4.11)                                           | Ink outlines and marks: checkbox, radio dot, switch, slider track, progress, selected days and tabs   | Done   |
| Indeterminate checkbox shows a check                                                            | Checkbox draws a dash                                                                                 | Done   |
| Translucent focus ring, under 3:1 on Paper                                                      | `FOCUS_RING`: 3px solid Focus outline                                                                 | Done   |
| English words (breadcrumb, carousel, command, pagination, calendar, sidebar, toast, spinner)    | Required translated props; calendar takes a locale                                                    | Done   |
| English day names write "1st", so the visible "1" is not in the name (WCAG 2.5.3)               | Calendar labels English days "November 1, 2026"                                                       | Done   |
| cmdk: list separators inside a list box; shadcn's CommandDialog leaves the search field unnamed | Separators hidden from AT; CommandDialog names the field after its title                              | Done   |
| `role="alert"` on every alert interrupts screen readers                                         | Alert: `status` for info, success and notes                                                           | Done   |
| Dialog's and Sheet's close button says "Close" in English                                       | Both require a translated `closeLabel`, or `showCloseButton={false}`; Sheet hides the primitive's one | Done   |
| ItemGroup is a `list` whose items are not list items                                            | Items in a group are `listitem`s; a link item gets a wrapper that is                                  | Done   |
| Native select: `w-fit` wrapper, disabled dimmed twice (25%)                                     | Full width by default; dimmed once                                                                    | Done   |
| Invalid field turns its label Danger                                                            | Label stays Ink; only FieldError is Danger                                                            | Done   |
| This theme's `rounded-md` (10px) turns a 20–24px box into a circle                              | Checkbox and Kbd use explicit small radii                                                             | Done   |
| Slider thumbs have no name                                                                      | Slider (on Radix directly) requires `thumbLabels`                                                     | Done   |
| ScrollArea's viewport cannot be scrolled from the keyboard                                      | Given a `label`, the viewport is a named, focusable region                                            | Done   |
| Skeleton pulses in Butter (`accent`), like a highlighted row                                    | Skeleton is quiet Line, hidden from assistive technology                                              | Done   |
| Resize handle has no name                                                                       | ResizableHandle requires a `label`                                                                    | Done   |

## The two rules

1. **`src/ui` is never edited.** Files there change only through
   `pnpm ui:add`. `ui-lock.json` holds their hashes and `pnpm lint` fails if one
   changes. Every change of look or behaviour goes into a branded component
   in `src/components/<name>`, which wraps the primitive.
2. **Consumers import branded components only**, never `src/ui`.

## Branded components

accordion · alert · alert-dialog · aspect-ratio · attachment · avatar · badge ·
breadcrumb · button · button-group · calendar · card · carousel · chart ·
checkbox · collapsible · combobox · command · context-menu · data-table ·
date-picker · dialog · drawer · dropdown-menu · empty · field · hover-card ·
input · input-group · input-otp · item · kbd · label · marker · menubar ·
message · message-scroller · native-select · navigation-menu · pagination ·
popover · progress · questionnaire · radio-group · resizable · scroll-area ·
select · separator · sheet · sidebar · skeleton · slider · spinner · switch ·
table · tabs · texture · toast · toggle · toggle-group · tooltip · trace

Attachment, Marker, Message, Message Scroller, Questionnaire, Texture and
Trace have no shadcn primitive; they are built for Deck Club from plain
elements and other components. Toast wraps shadcn's `sonner`.

Each is in Storybook under **Components**, one story per variant, and every
story passes axe (WCAG 2.2 AA). Two expected exceptions: the Dropdown Menu
and Select `Open` stories, where Radix hides the page behind the open list
(`aria-hidden-focus` on the trigger behind it, which focus cannot reach).

### The folder

```
src/components/<name>/
  <name>.tsx           the component (split into more files when it grows)
  index.tsx            export { Name } from './<name>.js';
  <name>.test.tsx      Vitest + Testing Library unit tests
  <name>.stories.tsx   a story for every variant
```

Pure helpers a component needs (formatting a file size, grouping options)
sit next to it as `<helper>.ts` with a `<helper>.test.ts`.

### The rules they follow

- **Wrap a primitive.** Import it as `#ui/<name>`, pass it brand classes, and
  leave `src/ui` alone. Other branded components are `#components/<name>`.
- **Share the recipes** in `src/lib/brand.ts`: `FOCUS_RING` (the 3px Focus
  outline that replaces shadcn's translucent ring), `SURFACE` (popovers,
  menus, dialogs), `MENU_ITEM`, `FIELD` (a form control's box), `PASTELS`.
- **Text is Ink; pastels are fills.** Where state would show in a pastel
  alone (a checked box, a selected day), add an Ink outline or mark.
- **No hard-coded words.** Anything read or announced (an accessible name, a
  placeholder, "Previous", "No results") is a prop, usually required, so the
  apps pass their translations (en, sk, cs). Dates and sizes format with
  `Intl` in the caller's locale.
- **Controlled or not.** Value components take `value`/`onValueChange` or
  `defaultValue`; `null` is a controlled empty value
  (`src/lib/use-controllable-state.ts`).
- **Write class names out in full.** Tailwind finds classes by reading the
  source, so `` `${prefix}:outline-focus` `` never reaches the stylesheet.
- **Name a checkbox or radio with `aria-labelledby`** when a label wraps it
  (choice cards): they are buttons, and a `<label>` does not name a button
  in every browser (HTML-AAM).
- **`"use client"`** on any component that uses a client hook or context;
  lint enforces it, so a Next.js server page can import the component.
- End relative imports with `.js` (`'./deck-tile.js'` for `deck-tile.tsx`).
  Lint enforces it: the emitted declarations must resolve under NodeNext,
  which the MCP views use.
- Consumers import a component as `@deck-club/ui/<name>`.

## Commands

| Task                              | Command                          |
| --------------------------------- | -------------------------------- |
| Storybook (http://localhost:6006) | `pnpm storybook`                 |
| Static Storybook                  | `pnpm storybook:build`           |
| Unit tests                        | `pnpm test`                      |
| Type-check (also src/ui)          | `pnpm typecheck`                 |
| Lint + src/ui lock check          | `pnpm lint`                      |
| Build `dist/` (JS, types, CSS)    | `pnpm build`                     |
| Add shadcn primitives             | `pnpm ui:add button card dialog` |
| Add every shadcn primitive        | `pnpm ui:add --all`              |
| Upgrade a primitive               | `pnpm ui:add button --overwrite` |

Run them in `packages/ui` or with `pnpm --filter @deck-club/ui <command>`.

Two things to know:

- **Formatting:** `packages/ui/.prettierignore` keeps Prettier out of
  `src/ui` when it runs from this folder (the root ignore file applies only
  from the root). If it ever rewrites a vendored file, `pnpm lint` says so.
- **Dead code:** knip resolves the `#` imports to `dist/` when a build
  exists, and then reports `src/lib` exports as unused. Run
  `pnpm --filter @deck-club/ui clean` before `pnpm deadcode` after a local
  build; CI runs on a clean checkout.

### Adding primitives

`pnpm ui:add` runs `shadcn add` with `components.json`, then records the
result in `ui-lock.json`. After it:

1. Review the diff of `src/ui` (and `src/ui/shadcn.css`).
2. The CLI adds npm dependencies with plain versions. `ui:add` puts back
   the `catalog:` entries it overwrote and names any new one: move it into
   the `catalog:` in `pnpm-workspace.yaml` and write `"catalog:"` in
   `package.json`, like every other dependency in the repo, then run
   `pnpm install`. Drop one that no file imports (the CLI adds `date-fns`
   with `calendar`).
3. If `src/ui/shadcn.css` gained a variable, map it to a brand colour in
   `src/styles/theme.css`.

`src/lib/utils.ts` is ours (the brand-aware `cn`): `ui:add` keeps it even when
the CLI would overwrite it.

## Theme

`src/styles/theme.css` holds the brand tokens (`--color-paper`, `--color-ink`,
`--color-lilac`…, fonts, sticker shadows, `rounded-card`) and maps shadcn's
semantic tokens onto them: `primary` Lilac, `accent` Butter, `muted`/`secondary`
Line, `destructive` the dark rose `#9b1c41`, `input` Ink soft (3:1 against the
surface), `ring` Focus. Light mode only: `dark:` classes in primitives are
bound to a `.dark` class that Deck Club never renders.

## Using it

Add the dependency to the app: `"@deck-club/ui": "workspace:*"`. Turbo builds
the library before the app (`^build`).

**Web app (Next.js + Tailwind).** Import the theme into the app's stylesheet,
after Tailwind. It also tells Tailwind to generate the library's utilities:

```css
@import 'tailwindcss';
@import '@deck-club/ui/theme.css';
```

```tsx
import { DeckTile } from '@deck-club/ui/deck-tile';
```

Components keep their `"use client"` directives, so server components can
render them.

**MCP Apps views (esbuild, no Tailwind).** Import components the same way;
esbuild bundles them into the view. Inline the precompiled
`@deck-club/ui/styles.css` (Tailwind preflight, the theme and every utility
the library uses) into the view's document in place of hand-written CSS. The
fonts come from Google Fonts as the views load them today.
