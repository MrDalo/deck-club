---
name: 'i18n'
description: 'Use for any user-facing text in apps/web: adding or changing copy, plurals, locale routing, the language switcher, or a new locale. next-intl setup, the three catalogues (en, sk, cs), typed keys, the lint rule against JSX literals, and the writing voice.'
---

# Internationalisation (next-intl)

- **Locales:** `en` (default, no URL prefix), `sk`, `cs` (`/sk/…`, `/cs/…`),
  defined once in `src/i18n/routing.ts`. The proxy negotiates the locale and
  remembers it in the `NEXT_LOCALE` cookie.
- **Catalogues:** `apps/web/messages/{en,sk,cs}.json`, namespaced by area
  (`nav`, `landing`, `auth`, `decks.library`, `decks.editor`, `connectAi`,
  `validation`, `errors`). `src/i18n/messages.test.ts` fails if a key is
  missing from any locale.
- **Typed keys:** `src/i18n/global.d.ts` types `t('…')` against `en.json`.
- **Server components:** `const t = await getTranslations('ns')`. Pages call
  `setRequestLocale(locale)` first. **Client components:** `useTranslations`.
- **Never** a string literal in JSX (ESLint `no-restricted-syntax`); never
  build sentences by concatenation — use ICU arguments: `t('sentLead', {
email })`.
- **Plurals:** `{count, plural, =0 {…} one {# card} other {# cards}}`; Slovak
  and Czech also need `few` (`# kartičky`).
- **Validation messages** come from `validation.<zod issue code>` via
  `FieldError`; the schema in contracts stays the only validator.
- **Navigation:** `Link`, `redirect`, `useRouter`, `usePathname` from
  `@/i18n/navigation` only.
- **Language names** of card content come from `Intl.DisplayNames` in the UI
  locale, not from the catalogue.
- Card content is never translated.

## Voice

Plain, warm, second person, sentence case. Buttons say what happens ("Add
card", "Email me a sign-in link"); the confirmation uses the same verb ("Card
added."). Errors say what happened and what to do, without apologising.
Slovak and Czech use the informal "ty". Glossary terms: deck → balíček, card →
kartička.

## Adding a locale

Add it to `routing.locales`, create `messages/<locale>.json` with every key,
add its name under `locales` in every catalogue, and check plural categories.
