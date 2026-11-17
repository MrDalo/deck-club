---
description: Web rules for apps/web — the three layers (app, features, shared) with feature groups that never import each other, server components by default, TanStack Query through one key factory and the /api/v1 forwarder, React Hook Form with contracts schemas, next-intl for every string in en/sk/cs, the pastel light-only brand, accessibility. Loaded for files under apps/web.
paths:
  - 'apps/web/**'
---

# Web

[`docs/frontend-structure.md`](../../docs/frontend-structure.md) is normative
and read in full before placing a file. This is the short form.

## Layers

```
src/app/        routes ([locale]/…), layouts, route handlers (api/v1, auth), _providers, _shell, _auth
src/features/   feature groups: landing · auth · decks · connect-ai  (later: study · stats · clubs · battles · settings)
src/shared/     api · supabase · ui · lib — would make sense unchanged in another product
src/i18n/       routing, navigation, request config
messages/       en.json · sk.json · cs.json
```

| From       | May import                                                               |
| ---------- | ------------------------------------------------------------------------ |
| `app`      | features, shared, i18n, packages                                         |
| `features` | its own group, shared, i18n, packages — never another group, never `app` |
| `shared`   | shared, i18n, packages                                                   |

Inside a group: `<group>/<screen>/{components,hooks,data,lib}` and group-level
`<group>/{data,lib}` for what two screens share. No barrel files. Cross-group
composition happens in a route. ESLint enforces the matrix.

## Rendering and data

- **Server components by default.** `'use client'` only for interactivity,
  hooks or browser APIs. Pages check auth with `requireUser(locale)`.
- **All API traffic** goes through `shared/api/api-client.ts` to the
  `/api/v1/*` forwarder, which attaches the session token and calls the API on
  the private network. The browser never calls the API host directly and
  never sees a service key.
- **TanStack Query**: `queryOptions` factories in `<group>/data/`, keys only
  from `shared/api/query-keys.ts`, mutations in hooks that invalidate exact
  keys. Retry transient errors only (`shouldRetry`).
- **Forms**: React Hook Form + `zodResolver(<contracts schema>)` + the
  shared `Form` (method post, noValidate). Messages come from
  `validation.<zod issue code>`; never write a second validator.
- **Errors**: `ErrorNotice` inline beside what failed, retry only for
  transient errors, `traceId` shown for support.
- No logic in JSX: stateful logic in `hooks/`, pure logic in `lib/`.

## i18n (next-intl)

- Every user-facing string is a key in `messages/en.json` **and** `sk.json`
  **and** `cs.json` (a test fails on any missing key; ESLint fails on JSX
  text literals). Plurals use ICU (`{count, plural, …}`) with Slovak and
  Czech `few` forms.
- Use `Link`, `redirect`, `useRouter` from `@/i18n/navigation`, never from
  `next/link` or `next/navigation` (locale-aware URLs; English has no prefix).
- Message keys are typed (`src/i18n/global.d.ts`): a typo fails typecheck.
- Card content is never translated and may be any script, including RTL.

## Brand (light mode only)

Tokens in `src/app/globals.css` (`brand-ui` skill): paper `#faf8ff`, ink
`#24203a`, pastels lilac, mint, peach, sky, butter, rose. Pastels are fills,
**never** text colour; text is ink or ink-soft. No dark mode, no
`dark:` variants. Sticker buttons from `shared/ui/button.tsx`; the
highlighter swipe (`.highlight`) is reserved for one heading per page.

## Accessibility (WCAG 2.2 AA, spec 11)

Labels on every field, `aria-invalid` + `aria-describedby` to the error,
`role="alert"` for errors and `role="status"` for confirmations, visible focus
(never remove the outline), a skip link, keyboard-first flows (the card
editor: Tab, Enter), `prefers-reduced-motion` respected.

## Security

Never `dangerouslySetInnerHTML`. Card text renders as text. Redirect targets
pass `safeRedirectPath`. Only `NEXT_PUBLIC_*` values that are public by
design (Supabase URL, publishable key, MCP URL).
