import { defineConfig } from 'drizzle-kit';

// Each module owns its tables in `infrastructure/drizzle/*.schema.ts`
// (rule 25-data); the shared kernel's own tables (idempotency keys, not
// business data) sit next to their adapter in `src/common/*/`. drizzle-kit
// collects them all into one migration history.
export default defineConfig({
  dialect: 'turso',
  schema: ['./src/modules/*/infrastructure/drizzle/*.schema.ts', './src/common/*/*.schema.ts'],
  out: './drizzle',
  dbCredentials: { url: process.env['DATABASE_URL'] ?? 'file:./data/deck-club.db' },
});
