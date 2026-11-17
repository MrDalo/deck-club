# apps/web folder structure

> **Status: normative** for all code in `apps/web` (rule `30-web`). ESLint
> (`eslint-plugin-boundaries`) enforces the import matrix below.

## The three layers

```
apps/web/
  messages/      en.json · sk.json · cs.json — every user-facing string
  src/
    app/         Next App Router: [locale]/ routes and layouts, route handlers
                 (api/v1 forwarder, auth/callback, auth/sign-out), and the
                 wired-once folders _providers/, _shell/, _auth/
    features/    one folder per feature group
    shared/      would make sense unchanged in a different product
    i18n/        next-intl routing, navigation, request config, typed keys
    proxy.ts     Next 16 proxy: locale negotiation + Supabase session refresh
```

### app

Routes, layouts, metadata, route handlers and page assembly. A page checks
auth (`requireUser(locale)`), sets the locale and composes feature
components. Cross-group composition happens here and only here. Out:
business logic, fetching code, forms.

### features

| Group        | Screens                                                          | Reads                         |
| ------------ | ---------------------------------------------------------------- | ----------------------------- |
| `landing`    | the signed-out front page                                        | nothing                       |
| `auth`       | sign-in (magic link)                                             | Supabase Auth                 |
| `decks`      | deck library + create form · deck page + card editor + card list | `/decks`, `/decks/:id/cards`  |
| `connect-ai` | Connect your AI                                                  | the session token (temporary) |

Planned groups: `study` (Today, review session, summary), `stats`, `clubs`,
`battles`, `settings`, `import-export`.

Internal shape:

```
features/<group>/<screen>/{components,hooks,data,lib}/
features/<group>/{data,lib}/        shared by two or more screens of the group
```

`components/` render, `hooks/` hold state and side effects, `data/` holds
TanStack `queryOptions` factories, `lib/` holds pure functions. Pure `.ts`
logic never sits in `components/`.

### shared

| Folder      | Holds                                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api/`      | `api-client.ts` (fetch to `/api/v1`, `ApiError`, retry policy), `query-keys.ts` (the one key factory), `api-forwarding.ts` (the forwarder's allowlist) |
| `supabase/` | browser and server clients, the proxy session refresh                                                                                                  |
| `ui/`       | `Button`, `Input`, `Textarea`, `Select`, `Label`, `FieldError`, `Form`, `ErrorNotice`, `LogoMark`                                                      |
| `lib/`      | `cn`, `env`, `safe-redirect`, `use-copy-to-clipboard`                                                                                                  |

Out: anything that names a deck, card, club or review — that is a feature or
contracts.

## Which way imports point

| From \ may import | app | features           | shared | i18n | packages |
| ----------------- | --- | ------------------ | ------ | ---- | -------- |
| **app**           | own | any group          | yes    | yes  | yes      |
| **features**      | no  | **own group only** | yes    | yes  | yes      |
| **shared**        | no  | no                 | own    | yes  | yes      |
| **i18n**          | no  | no                 | no     | own  | yes      |

No barrel files.

## Where does a new file go

Stop at the first yes:

1. A URL, layout, route handler, provider or app chrome? → `app/`
2. A schema, type, limit or error code? → `packages/contracts`
3. Would it make sense unchanged in another product? → `shared/`
4. Otherwise the owning group: one screen uses it → that screen's folder; two
   or more → group level.

## Promotion is earned

| Trigger                                    | Destination                                |
| ------------------------------------------ | ------------------------------------------ |
| A second app needs it                      | a package                                  |
| A second feature group needs it            | `shared/` (or contracts if it is a schema) |
| A second screen in the same group needs it | group level                                |

## Invariants

1. **The API is reached only through `/api/v1`.** The browser never calls the
   API host and never holds a service key; the route handler attaches the
   session token.
2. **One query-key factory.** Child keys nest under parent keys
   (`['decks', id, 'cards']` under `['decks', id]`) so one invalidation
   refreshes what depends on it.
3. **One validator.** Forms use the contracts schema through `zodResolver`;
   error text comes from `validation.<issue code>`.
4. **Every string is a message key** in all three locales.
5. **Light mode only.** Brand tokens in `app/globals.css`; no `dark:`.
