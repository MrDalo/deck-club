import { Logger } from '@nestjs/common';
import { describe, expect, it, type MockInstance, vi } from 'vitest';
import { DeckClubError } from '../errors/deck-club-error.js';
import { refusal, runTool } from './tool-registration.js';
import { testCaller } from './testing/mcp-test-client.js';

const reply = (text: string) => () => Promise.resolve({ text });

describe('refusal', () => {
  it('reads REJECTED: <CODE>. <detail> as an error result', () => {
    expect(refusal(new DeckClubError('DECK_NOT_FOUND', 'No deck with that id.'))).toEqual({
      content: [{ type: 'text', text: 'REJECTED: DECK_NOT_FOUND. No deck with that id.' }],
      isError: true,
    });
  });
});

describe('runTool', () => {
  it('returns the use case’s text on success', async () => {
    await expect(
      runTool(testCaller(), 'list_decks', 'decks:read', reply('Two decks.')),
    ).resolves.toEqual({
      content: [{ type: 'text', text: 'Two decks.' }],
    });
  });

  it('passes structured content through for MCP Apps views', async () => {
    const result = await runTool(testCaller(), 'get_stats', 'study', () =>
      Promise.resolve({ text: 'Streak: 4 days.', structuredContent: { streakDays: 4 } }),
    );

    expect(result.structuredContent).toEqual({ streakDays: 4 });
  });

  it('refuses without running the use case when the scope was not granted', async () => {
    let ran = false;

    const result = await runTool(
      testCaller({ scopes: ['decks:read'] }),
      'list_clubs',
      'clubs',
      () => {
        ran = true;
        return Promise.resolve({ text: 'ok' });
      },
    );

    expect(ran).toBe(false);
    expect(result).toMatchObject({ isError: true });
    expect(result.content[0]).toMatchObject({
      text: expect.stringMatching(/^REJECTED: FORBIDDEN\./) as string,
    });
  });

  it('relays a refusal from the core API as a tool result', async () => {
    const result = await runTool(testCaller(), 'add_cards', 'decks:write', () =>
      Promise.reject(new DeckClubError('VALIDATION_FAILED', 'The front is empty.')),
    );

    expect(result.content[0]).toMatchObject({
      text: 'REJECTED: VALIDATION_FAILED. The front is empty.',
    });
  });

  it('hides the message of an unexpected error behind INTERNAL', async () => {
    const result = await runTool(testCaller(), 'list_decks', 'decks:read', () =>
      Promise.reject(new Error('SQLITE_BUSY at /data/deck-club.db')),
    );

    expect(result).toMatchObject({ isError: true });
    expect(JSON.stringify(result)).not.toContain('SQLITE');
    expect(result.content[0]).toMatchObject({
      text: expect.stringMatching(/^REJECTED: INTERNAL\./) as string,
    });
  });
});

describe('runTool logging', () => {
  type LogSpy = MockInstance<(message: unknown) => void>;

  const spyOnLog = (): LogSpy => vi.spyOn(Logger.prototype, 'log').mockReturnValue(undefined);

  const lines = (log: LogSpy): Record<string, unknown>[] =>
    log.mock.calls.map(([line]) => line as Record<string, unknown>);

  it('records one line per call with the tool, the user and how long it took', async () => {
    const log = spyOnLog();

    await runTool(testCaller(), 'list_decks', 'decks:read', reply('Two decks.'));

    expect(lines(log)).toEqual([
      {
        evt: 'mcp.tool.called',
        tool: 'list_decks',
        outcome: 'ok',
        user: 'user-ana',
        client: 'Claude',
        durationMs: expect.any(Number) as number,
      },
    ]);
  });

  it('records a refusal with its code', async () => {
    const log = spyOnLog();

    await runTool(testCaller(), 'get_deck', 'decks:read', () =>
      Promise.reject(new DeckClubError('DECK_NOT_FOUND', 'No deck with that id.')),
    );
    await runTool(testCaller({ scopes: [] }), 'add_cards', 'decks:write', reply('never'));

    expect(lines(log).map((line) => [line.tool, line.outcome, line.code])).toEqual([
      ['get_deck', 'refused', 'DECK_NOT_FOUND'],
      ['add_cards', 'refused', 'FORBIDDEN'],
    ]);
  });

  it('never writes the access token or the card content it handled', async () => {
    const log = spyOnLog();
    const error = vi.spyOn(Logger.prototype, 'error').mockReturnValue(undefined);

    await runTool(testCaller(), 'add_cards', 'decks:write', () =>
      Promise.reject(new Error('failed to write card "hola"')),
    );

    const written = JSON.stringify([...lines(log), ...(error.mock.calls as unknown[][])]);
    expect(written).not.toContain('token-ana');
    expect(written).not.toContain('hola');
    expect(written).toContain('"outcome":"failed"');
  });
});
