---
name: 'web-feature'
description: 'Use when adding a screen, route, form or feature group to apps/web: where each file goes, the order to build in, the data and form patterns, translations in three locales, and the tests each piece needs. Modelled on src/features/decks.'
---

# Adding a web feature

`docs/frontend-structure.md` is normative; the reference implementation is
`src/features/decks`.

## Placement ladder (stop at the first yes)

1. A URL, layout, route handler, provider or app chrome? → `src/app/`
2. A schema, type, limit or error code? → `packages/contracts`
3. Would it make sense unchanged in another product (a button, the API
   client, a clipboard hook)? → `src/shared/`
4. Otherwise the owning feature group. One screen uses it → that screen's
   folder; two screens → group-level `data/` or `lib/`. By kind: renders →
   `components/`, uses hooks → `hooks/`, fetches → `data/`, else `lib/`.

## Order

1. **Messages** — add keys to `messages/en.json`, `sk.json`, `cs.json`
   together (the catalogue test fails otherwise). Slovak and Czech plurals
   need `few`.
2. **Queries** — `<group>/data/<thing>-queries.ts`: `queryOptions` factories
   using `apiRequest(path, ContractsSchema)` and keys from
   `shared/api/query-keys.ts` (add keys there; nest child keys under parents
   so invalidation cascades). Test the keys and the unwrapping.
3. **The forwarder** — a new top-level API resource must be added to
   `FORWARDED_ROOTS` in `shared/api/api-forwarding.ts` (and its test).
4. **Hooks** — `<screen>/hooks/use-<thing>.ts`: forms with
   `useForm({ resolver: zodResolver(ContractsSchema) })`, mutations that
   invalidate exact keys. Return a typed state object.
5. **Components** — client components only when interactive. Use
   `shared/ui` (`Button`, `Input`, `Label`, `FieldError`, `Form`,
   `ErrorNotice`). Every string via `useTranslations` / `getTranslations`.
6. **Route** — `app/[locale]/<path>/page.tsx`: `resolveLocale`,
   `setRequestLocale`, `requireUser(locale)` for signed-in pages,
   `generateMetadata` with a translated title. Compose groups here.
7. **Tests** — node tests for `lib/` and `data/`; a `*.dom.test.tsx` for a
   form or flow with behaviour (validation messages, keyboard, success state).

## Check in the browser

`pnpm dev`, then use the screen at 1440×900 and 390×844, by keyboard too.
