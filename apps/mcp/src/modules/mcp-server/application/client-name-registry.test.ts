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

  it('evicts the oldest name instead of growing without limit', () => {
    const registry = new ClientNameRegistry();
    for (let index = 0; index < 10_000; index += 1) registry.remember(`token-${index}`, 'Claude');

    registry.remember('token-new', 'Codex');

    expect(registry.recall('token-0')).toBeUndefined();
    expect(registry.recall('token-1')).toBe('Claude');
    expect(registry.recall('token-new')).toBe('Codex');
  });
});
