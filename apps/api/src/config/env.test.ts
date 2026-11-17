import { describe, expect, it } from 'vitest';
import { loadEnv } from './env.js';

describe('loadEnv', () => {
  it('applies defaults when only the Supabase URL is set', () => {
    const env = loadEnv({ SUPABASE_URL: 'https://example.supabase.co' });

    expect(env).toMatchObject({
      API_PORT: 4000,
      DATABASE_URL: 'file:./data/deck-club.db',
      LOG_FORMAT: 'pretty',
    });
  });

  it('coerces the port from a string', () => {
    expect(
      loadEnv({ SUPABASE_URL: 'https://example.supabase.co', API_PORT: '4100' }).API_PORT,
    ).toBe(4100);
  });

  it('names every missing variable in the error', () => {
    expect(() => loadEnv({})).toThrow(/SUPABASE_URL/);
  });
});
