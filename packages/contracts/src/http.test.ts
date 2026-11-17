import { describe, expect, it } from 'vitest';
import { parseBearerToken } from './http.js';

describe('parseBearerToken', () => {
  it('extracts the token from a bearer header', () => {
    expect(parseBearerToken('Bearer abc.def.ghi')).toBe('abc.def.ghi');
  });

  it('accepts any casing of the scheme', () => {
    expect(parseBearerToken('bearer abc')).toBe('abc');
  });

  it('returns null without a header', () => {
    expect(parseBearerToken(undefined)).toBeNull();
  });

  it('returns null for another scheme', () => {
    expect(parseBearerToken('Basic dXNlcjpwYXNz')).toBeNull();
  });
});
