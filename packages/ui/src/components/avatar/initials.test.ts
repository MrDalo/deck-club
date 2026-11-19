import { describe, expect, it } from 'vitest';
import { initialsOf } from './initials';

describe('initialsOf', () => {
  it.each([
    ['Jana Nováková', 'JN'],
    ['ada lovelace king', 'AK'],
    ['  Claude  ', 'C'],
    ['ľubica čierna', 'ĽČ'],
    ['', ''],
    ['   ', ''],
    ['🃏 Club', '🃏C'],
  ])('%j → %j', (name, expected) => {
    expect(initialsOf(name)).toBe(expected);
  });

  it('upper-cases for the given locale', () => {
    expect(initialsOf('ilknur yılmaz', 'tr')).toBe('İY');
  });
});
