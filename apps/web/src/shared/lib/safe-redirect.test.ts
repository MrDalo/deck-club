import { describe, expect, it } from 'vitest';
import { safeRedirectPath } from './safe-redirect';

describe('safeRedirectPath', () => {
  it('keeps a same-site path', () => {
    expect(safeRedirectPath('/decks/abc')).toBe('/decks/abc');
  });

  it('falls back when nothing is given', () => {
    expect(safeRedirectPath(null)).toBe('/decks');
  });

  it.each(['//evil.example', 'https://evil.example', '/\\evil.example', 'decks'])(
    'refuses %s',
    (candidate) => {
      expect(safeRedirectPath(candidate)).toBe('/decks');
    },
  );
});
