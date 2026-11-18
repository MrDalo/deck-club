import { describe, expect, it } from 'vitest';
import {
  FindWeakSpotsPromptArgsSchema,
  MakeCardsPromptArgsSchema,
  MCP_PROMPT_NAMES,
  PROMPT_SOURCE_MAX_LENGTH,
  QuizMePromptArgsSchema,
} from './mcp-prompts.js';

describe('MCP prompt catalogue', () => {
  it('publishes the three product spec 9 prompts', () => {
    expect([...MCP_PROMPT_NAMES].sort()).toEqual(['find_weak_spots', 'make_cards', 'quiz_me']);
  });
});

describe('MakeCardsPromptArgsSchema', () => {
  it('accepts pasted text with a deck name and a count', () => {
    expect(
      MakeCardsPromptArgsSchema.parse({
        source: ' Photosynthesis… ',
        deck: 'Biology',
        count: '20',
      }),
    ).toEqual({ source: 'Photosynthesis…', deck: 'Biology', count: '20' });
  });

  it('rejects an empty source', () => {
    expect(MakeCardsPromptArgsSchema.safeParse({ source: '  ' }).success).toBe(false);
  });

  it('rejects a source longer than a long article', () => {
    const source = 'x'.repeat(PROMPT_SOURCE_MAX_LENGTH + 1);

    expect(MakeCardsPromptArgsSchema.safeParse({ source }).success).toBe(false);
  });

  it('rejects a count that is not a whole number', () => {
    expect(MakeCardsPromptArgsSchema.safeParse({ source: 'a', count: 'twenty' }).success).toBe(
      false,
    );
  });
});

describe('QuizMePromptArgsSchema', () => {
  it('needs no arguments', () => {
    expect(QuizMePromptArgsSchema.parse({})).toEqual({});
  });
});

describe('FindWeakSpotsPromptArgsSchema', () => {
  it('rejects a deck name longer than a deck title may be', () => {
    expect(FindWeakSpotsPromptArgsSchema.safeParse({ deck: 'x'.repeat(121) }).success).toBe(false);
  });
});
