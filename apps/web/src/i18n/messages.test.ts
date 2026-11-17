import { describe, expect, it } from 'vitest';
import cs from '../../messages/cs.json';
import en from '../../messages/en.json';
import sk from '../../messages/sk.json';

/** Every leaf key path of a message tree, e.g. `decks.library.title`. */
function keyPaths(tree: object, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix === '' ? key : `${prefix}.${key}`;
    return typeof value === 'object' && value !== null ? keyPaths(value as object, path) : [path];
  });
}

describe('message catalogues', () => {
  const english = keyPaths(en).sort();

  it.each([
    ['sk', sk],
    ['cs', cs],
  ])('%s has exactly the English keys', (_locale, catalogue) => {
    expect(keyPaths(catalogue).sort()).toEqual(english);
  });
});
