import { describe, expect, it } from 'vitest';
import { ClientNameRegistry } from './client-name-registry.js';

describe('ClientNameRegistry', () => {
  it('recalls the name remembered for the same token', () => {
    const registry = new ClientNameRegistry();
    registry.remember('token-ana', 'Claude');

    expect(registry.recall('token-ana')).toBe('Claude');
  });

  it('knows nothing about another token', () => {
    const registry = new ClientNameRegistry();
    registry.remember('token-ana', 'Claude');

    expect(registry.recall('token-ben')).toBeUndefined();
  });

  it('forgets a name after twelve hours', () => {
    let now = 0;
    const registry = new ClientNameRegistry(() => now);
    registry.remember('token-ana', 'Claude');

    now = 12 * 60 * 60 * 1000;

    expect(registry.recall('token-ana')).toBeUndefined();
  });
});
