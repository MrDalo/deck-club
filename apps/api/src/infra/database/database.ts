import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';

/** The Drizzle handle every repository adapter receives. */
export type Database = LibSQLDatabase;

/** Nest injection token for {@link Database}. */
export const DATABASE = Symbol('DATABASE');

/** apps/api/drizzle, the same distance from src/ and from dist/. */
const MIGRATIONS_FOLDER = fileURLToPath(new URL('../../../drizzle', import.meta.url));

/**
 * Opens the SQLite database through libSQL, creating the parent folder of a
 * local file, and applies every pending migration before returning.
 * @param url - `file:./data/deck-club.db`, `:memory:` in tests, or a libSQL server URL
 * @returns a migrated Drizzle handle
 */
export async function openDatabase(url: string): Promise<Database> {
  if (url.startsWith('file:')) {
    mkdirSync(dirname(url.slice('file:'.length)), { recursive: true });
  }
  const client = createClient({ url });
  await client.execute('PRAGMA foreign_keys = ON');
  const database = drizzle(client);
  await migrate(database, { migrationsFolder: MIGRATIONS_FOLDER });
  return database;
}
