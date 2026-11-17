import { describe, expect, it } from 'vitest';
import { claudeCodeCommand } from './claude-code-command';

describe('claudeCodeCommand', () => {
  it('adds the server over HTTP with a bearer placeholder', () => {
    expect(claudeCodeCommand('https://mcp.deck.club/mcp')).toBe(
      'claude mcp add --transport http deck-club https://mcp.deck.club/mcp --header "Authorization: Bearer TOKEN"',
    );
  });
});
