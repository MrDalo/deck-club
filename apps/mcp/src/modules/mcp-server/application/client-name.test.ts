import { describe, expect, it } from 'vitest';
import { UNKNOWN_CLIENT_NAME } from '../../../common/mcp/mcp-caller.js';
import { resolveClientName } from './client-name.js';

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

describe('resolveClientName, long names', () => {
  it('cuts a long unrecognised name to what the API stores', () => {
    expect(resolveClientName('x'.repeat(200), undefined)).toHaveLength(64);
  });

  it('recognises Codex and Cursor from the User-Agent', () => {
    expect(resolveClientName(undefined, 'codex-cli/0.5')).toBe('Codex');
    expect(resolveClientName(undefined, 'Cursor/1.2')).toBe('Cursor');
  });
});
