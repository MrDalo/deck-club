import { describe, expect, it } from 'vitest';
import { buildForwardUrl } from './api-forwarding';

const API = 'http://api:4000';

describe('buildForwardUrl', () => {
  it('forwards a deck path to the core API', () => {
    expect(
      buildForwardUrl(
        API,
        ['decks', '00000000-0000-4000-8000-000000000001', 'cards'],
        '',
      )?.toString(),
    ).toBe('http://api:4000/decks/00000000-0000-4000-8000-000000000001/cards');
  });

  it('keeps the query string', () => {
    expect(buildForwardUrl(API, ['decks'], '?page=2')?.toString()).toBe(
      'http://api:4000/decks?page=2',
    );
  });

  it('refuses a resource outside the allowlist', () => {
    expect(buildForwardUrl(API, ['health'], '')).toBeNull();
  });

  it('refuses path traversal', () => {
    expect(buildForwardUrl(API, ['decks', '..', 'admin'], '')).toBeNull();
  });

  it('refuses an empty path', () => {
    expect(buildForwardUrl(API, [], '')).toBeNull();
  });
});
