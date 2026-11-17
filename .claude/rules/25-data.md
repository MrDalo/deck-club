---
description: Data rules — SQLite through Drizzle and libSQL, each module owns its tables, forward-only generated migrations, soft delete, timestamps, round-trip tests. Loaded for schema, migration and repository files.
paths:
  - 'apps/api/src/modules/*/infrastructure/**'
  - 'apps/api/drizzle/**'
  - 'apps/api/drizzle.config.ts'
  - 'apps/api/src/infra/database/**'
---

# Data

- **SQLite via libSQL** (`@libsql/client`, `drizzle-orm/libsql`). A local
  file in development and Docker (`/data` volume), `:memory:` in tests, a
  libSQL server later without code changes (ADR 0003). Write queries that
  would also run on Postgres: no SQLite-only functions in repositories.
- **Each module owns its tables** in
  `modules/<module>/infrastructure/drizzle/<module>.schema.ts`. Another
  module never queries them; it calls the owner's facade. No cross-module
  foreign keys.
- **Migrations are generated, forward-only and committed**: change the
  schema, run `pnpm db:generate`, review the SQL, commit both. Never edit an
  applied migration. Destructive changes (drop, rename, narrowing) need an ADR
  line and a data-migration plan. The API applies pending migrations at boot.
- **Soft delete** for user content: `deleted_at` is set, every read filters
  `deleted_at IS NULL`. Hard deletion is a later purge job after 30 days.
- **Timestamps** are `integer` with `mode: 'timestamp_ms'`, set by the
  `Clock` port. Ids are UUID strings from the `IdGenerator` port.
- **JSON columns** only for small value lists (`tags`); anything queried by
  value gets its own table.
- **Every list query has an index** on its filter column, declared in the
  schema next to the table.
- **Batch writes are one statement** (or one transaction) so they are
  all-or-nothing.
- **Round-trip test:** every new column is written and read back through the
  real adapter (the HTTP tests in `apps/api/test` run on in-memory SQLite);
  an in-memory adapter alone can hide a dropped field.
- **Review/study history is append-only** (spec 3): reviews are inserted,
  never updated.
