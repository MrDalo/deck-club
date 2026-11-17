import { z } from 'zod';

/** Body of `GET /health` on every service (product spec 11, observability). */
export const HealthSchema = z.object({
  status: z.literal('ok'),
  service: z.string(),
  version: z.string(),
});
export type Health = z.infer<typeof HealthSchema>;
