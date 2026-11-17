# 0006. next-intl for internationalisation

- Status: Accepted
- Date: 2026-11-17

## Context

Spec 11: English first, every string externalised, Slovak and Czech next. The
web app is Next.js App Router with server components.

## Decision

next-intl: locale-prefixed routes (`as-needed`, English unprefixed), messages
in `apps/web/messages/*.json`, `getTranslations` in server components,
`useTranslations` in client components, typed keys, ICU plurals. Slovak and
Czech ship from day one.

## Consequences

Server-rendered pages in every locale; a missing key fails a test; JSX text
literals fail lint.

## Alternatives considered

react-i18next (client-first; server components need extra wiring).
