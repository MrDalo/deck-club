import { z } from 'zod';

/** Hostnames a browser-based MCP client may call from when nothing else is configured. */
const LOCAL_ORIGIN_HOSTNAMES = ['localhost', '127.0.0.1', '[::1]'];

const hostnameList = z.string().transform((value) =>
  value
    .split(',')
    .map((hostname) => hostname.trim().toLowerCase())
    .filter((hostname) => hostname !== ''),
);

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  MCP_PORT: z.coerce.number().int().min(1).max(65_535).default(4100),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('pretty'),
  API_INTERNAL_URL: z.url().default('http://localhost:4000'),
  WEB_PUBLIC_URL: z.url().default('http://localhost:3000'),
  /**
   * The public URL AI clients connect to. It is the OAuth resource identifier
   * (RFC 8707/9728), so it must match what clients were configured with.
   */
  MCP_PUBLIC_URL: z.url().default('http://localhost:4100/mcp'),
  /** The Supabase project; its Auth server is the OAuth 2.1 authorization server. */
  SUPABASE_URL: z.url(),
  /** The publishable (or legacy anon) key. Public by design, never the secret key. */
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  /**
   * Extra hostnames a browser may send as `Origin` (DNS-rebinding protection).
   * Requests without an Origin (every non-browser AI client) are not affected.
   */
  MCP_ALLOWED_ORIGINS: hostnameList.default([]),
  GIT_SHA: z.string().default('dev'),
});

/** Validated process configuration, parsed once at boot. */
export type Env = z.infer<typeof EnvSchema>;

/** Nest injection token for {@link Env}. */
export const ENV = Symbol('ENV');

/**
 * Parses the environment once at boot. The publishable key falls back to the
 * web app's `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, so one root `.env` feeds
 * every service.
 * @param source - the variables to read, `process.env` in production
 * @returns the validated configuration
 * @throws Error listing every invalid variable, so boot exits non-zero
 */
export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const result = EnvSchema.safeParse({
    ...source,
    SUPABASE_PUBLISHABLE_KEY:
      source.SUPABASE_PUBLISHABLE_KEY ?? source.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  if (result.success) return result.data;
  const problems = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
  throw new Error(`Invalid MCP environment:\n  ${problems.join('\n  ')}`);
}

/**
 * Hostnames whose browser `Origin` the MCP endpoint accepts: the local
 * development hosts, the MCP server's own host and any configured extras.
 * @param env - the validated configuration
 * @returns a de-duplicated hostname allowlist
 */
export function allowedOriginHostnames(env: Env): string[] {
  const ownHost = new URL(env.MCP_PUBLIC_URL).hostname.toLowerCase();
  return [...new Set([...LOCAL_ORIGIN_HOSTNAMES, ownHost, ...env.MCP_ALLOWED_ORIGINS])];
}
