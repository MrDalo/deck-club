import { describe, expect, it } from 'vitest';
import { allowedOriginHostnames, loadEnv } from './env.js';

const SUPABASE = {
  SUPABASE_URL: 'https://ref.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
};

describe('loadEnv', () => {
  it('defaults to the local API, web app and MCP URL', () => {
    expect(loadEnv(SUPABASE)).toMatchObject({
      MCP_PORT: 4100,
      API_INTERNAL_URL: 'http://localhost:4000',
      WEB_PUBLIC_URL: 'http://localhost:3000',
      MCP_PUBLIC_URL: 'http://localhost:4100/mcp',
      MCP_ALLOWED_ORIGINS: [],
    });
  });

  it('requires the Supabase project URL, because it is the OAuth authorization server', () => {
    expect(() => loadEnv({ SUPABASE_PUBLISHABLE_KEY: 'key' })).toThrow(/SUPABASE_URL/);
  });

  it('requires a publishable key', () => {
    expect(() => loadEnv({ SUPABASE_URL: 'https://ref.supabase.co' })).toThrow(
      /SUPABASE_PUBLISHABLE_KEY/,
    );
  });

  it('falls back to the web app’s publishable key from the shared root .env', () => {
    const env = loadEnv({
      SUPABASE_URL: 'https://ref.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_web',
    });

    expect(env.SUPABASE_PUBLISHABLE_KEY).toBe('sb_publishable_web');
  });

  it('prefers its own publishable key over the web app’s', () => {
    const env = loadEnv({ ...SUPABASE, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'other' });

    expect(env.SUPABASE_PUBLISHABLE_KEY).toBe('sb_publishable_test');
  });

  it('rejects an API URL that is not a URL', () => {
    expect(() => loadEnv({ ...SUPABASE, API_INTERNAL_URL: 'api' })).toThrow(/API_INTERNAL_URL/);
  });

  it('splits, trims and lowercases the allowed origins', () => {
    const env = loadEnv({
      ...SUPABASE,
      MCP_ALLOWED_ORIGINS: ' Inspector.Example.com , ,tools.dev',
    });

    expect(env.MCP_ALLOWED_ORIGINS).toEqual(['inspector.example.com', 'tools.dev']);
  });
});

describe('allowedOriginHostnames', () => {
  it('allows the local hosts and the MCP server’s own public host', () => {
    const env = loadEnv({ ...SUPABASE, MCP_PUBLIC_URL: 'https://mcp.deck.club/mcp' });

    expect(allowedOriginHostnames(env)).toEqual([
      'localhost',
      '127.0.0.1',
      '[::1]',
      'mcp.deck.club',
    ]);
  });

  it('adds configured hostnames once each', () => {
    const env = loadEnv({ ...SUPABASE, MCP_ALLOWED_ORIGINS: 'localhost,inspector.dev' });

    expect(allowedOriginHostnames(env)).toEqual([
      'localhost',
      '127.0.0.1',
      '[::1]',
      'inspector.dev',
    ]);
  });
});
