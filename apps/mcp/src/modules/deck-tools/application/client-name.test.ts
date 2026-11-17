import { describe, expect, it } from 'vitest';
import { resolveClientName, UNKNOWN_CLIENT_NAME } from './client-name.js';

describe('resolveClientName', () => {
  it('recognises Claude from the handshake name', () => {
    expect(resolveClientName('claude-ai', undefined)).toBe('Claude');
  });

  it('falls back to the User-Agent when there is no handshake', () => {
    expect(resolveClientName(undefined, 'openai-mcp/1.0.0')).toBe('ChatGPT');
  });

  it('keeps an unrecognised handshake name as given', () => {
    expect(resolveClientName('my-own-agent', 'node')).toBe('my-own-agent');
  });

  it('uses a neutral name when nothing identifies the client', () => {
    expect(resolveClientName(undefined, 'node')).toBe(UNKNOWN_CLIENT_NAME);
  });
});
