import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('pretty'),
  DATABASE_URL: z.string().min(1).default('file:./data/deck-club.db'),
  SUPABASE_URL: z.url(),
  GIT_SHA: z.string().default('dev'),
});

/** Validated process configuration (rule 20-backend: parsed by Zod at boot). */
export type Env = z.infer<typeof EnvSchema>;

/** Nest injection token for {@link Env}. */
export const ENV = Symbol('ENV');

/**
 * Parses the environment once at boot.
 * @param source - the variables to read, `process.env` in production
 * @returns the validated configuration
 * @throws Error listing every missing or invalid variable, so boot exits non-zero
 */
export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const result = EnvSchema.safeParse(source);
  if (result.success) return result.data;
  const problems = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
  throw new Error(`Invalid API environment:\n  ${problems.join('\n  ')}`);
}
