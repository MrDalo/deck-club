import { describe, expect, it } from 'vitest';
import { loadEnv } from './env.js';

describe('loadEnv', () => {
  it('defaults to the local API and web app', () => {
    expect(loadEnv({})).toMatchObject({
      MCP_PORT: 4100,
      API_INTERNAL_URL: 'http://localhost:4000',
    });
  });

  it('rejects an API URL that is not a URL', () => {
    expect(() => loadEnv({ API_INTERNAL_URL: 'api' })).toThrow(/API_INTERNAL_URL/);
  });
});
