import { z } from 'zod';

/** Body of `GET /health` on every service (product spec 11, observability). */
export const HealthSchema = z.object({
  status: z.literal('ok'),
  service: z.string(),
  version: z.string(),
});
export type Health = z.infer<typeof HealthSchema>;

/** Outcome of one dependency check inside a readiness report. */
export const DependencyCheckSchema = z.object({
  name: z.string(),
  status: z.enum(['up', 'down']),
  latencyMs: z.number().int().nonnegative(),
  /** A short, fixed reason when `down`; never a secret, a token or card content. */
  detail: z.string().optional(),
});
export type DependencyCheck = z.infer<typeof DependencyCheckSchema>;

/**
 * Body of `GET /health/ready`: whether the service can do useful work now,
 * i.e. every dependency it needs answers. Served with 200 when `ready` and
 * 503 when `not_ready`, so orchestrators can route traffic away.
 */
export const ReadinessSchema = z.object({
  status: z.enum(['ready', 'not_ready']),
  service: z.string(),
  version: z.string(),
  checks: z.array(DependencyCheckSchema),
});
export type Readiness = z.infer<typeof ReadinessSchema>;
