import { z } from 'zod';

const PublicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_MCP_URL: z.url().default('http://localhost:4100/mcp'),
});

const ServerEnvSchema = z.object({
  API_INTERNAL_URL: z.url().default('http://localhost:4000'),
});

/** Values safe for the browser bundle. */
export type PublicEnv = z.infer<typeof PublicEnvSchema>;

/**
 * Parses the public configuration. Each variable is named literally so Next
 * inlines it into the browser bundle at build time.
 * @returns the validated public configuration
 * @throws Error naming each missing variable
 */
export function publicEnv(): PublicEnv {
  return parse(PublicEnvSchema, {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_MCP_URL: process.env.NEXT_PUBLIC_MCP_URL,
  });
}

/**
 * Parses server-only configuration. Never call from a client component.
 * @returns where the Next.js server reaches the core API
 */
export function serverEnv(): z.infer<typeof ServerEnvSchema> {
  return parse(ServerEnvSchema, { API_INTERNAL_URL: process.env.API_INTERNAL_URL });
}

function parse<Output>(
  schema: z.ZodType<Output>,
  source: Record<string, string | undefined>,
): Output {
  const result = schema.safeParse(source);
  if (result.success) return result.data;
  const problems = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
  throw new Error(`Invalid web environment: ${problems.join('; ')}`);
}
