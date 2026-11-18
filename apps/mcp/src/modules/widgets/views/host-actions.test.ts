import { describe, expect, it } from 'vitest';
import { hostActionFor } from './host-actions.js';

describe('hostActionFor', () => {
  it('opens a link through the host', () => {
    expect(hostActionFor({ action: 'open', value: 'https://deck.club/decks' })).toEqual({
      kind: 'open',
      url: 'https://deck.club/decks',
    });
  });

  it('asks the assistant', () => {
    expect(hostActionFor({ action: 'ask', value: 'Quiz me' })).toEqual({
      kind: 'ask',
      text: 'Quiz me',
    });
  });

  it('hands any other action to the view itself', () => {
    expect(hostActionFor({ action: 'more', value: 'cursor-1' })).toEqual({
      kind: 'custom',
      name: 'more',
      value: 'cursor-1',
    });
  });

  it('does nothing for an element without an action or a value', () => {
    expect(hostActionFor({})).toEqual({ kind: 'none' });
    expect(hostActionFor({ action: 'open' })).toEqual({ kind: 'none' });
    expect(hostActionFor({ action: '', value: 'x' })).toEqual({ kind: 'none' });
  });
});
