import { PASTELS, type Pastel } from './brand.js';

/**
 * A stable pastel for a seed (a name, an id): the same seed always gets the
 * same colour, so a person's avatar or a deck's tab never changes colour.
 * @param seed - any string
 * @returns one of the six pastels
 */
export function pastelFor(seed: string): Pastel {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
  return PASTELS[hash % PASTELS.length] ?? 'lilac';
}
