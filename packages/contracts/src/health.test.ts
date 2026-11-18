import { describe, expect, it } from 'vitest';
import { ReadinessSchema } from './health.js';

describe('ReadinessSchema', () => {
  it('accepts a report with a failed dependency and its reason', () => {
    const report = {
      status: 'not_ready',
      service: 'mcp',
      version: 'dev',
      checks: [{ name: 'api', status: 'down', latencyMs: 3000, detail: 'timed out' }],
    };

    expect(ReadinessSchema.parse(report)).toEqual(report);
  });

  it('rejects a negative latency', () => {
    const report = {
      status: 'ready',
      service: 'mcp',
      version: 'dev',
      checks: [{ name: 'api', status: 'up', latencyMs: -1 }],
    };

    expect(ReadinessSchema.safeParse(report).success).toBe(false);
  });
});
