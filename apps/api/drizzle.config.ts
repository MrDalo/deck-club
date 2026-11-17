import { defineConfig } from 'drizzle-kit';

// Each module owns its tables in `infrastructure/drizzle/*.schema.ts`
// (rule 25-data); drizzle-kit collects them into one migration history.
export default defineConfig({
  dialect: 'turso',
  schema: './src/modules/*/infrastructure/drizzle/*.schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env['DATABASE_URL'] ?? 'file:./data/deck-club.db' },
});
