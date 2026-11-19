/**
 * Initials for an avatar: the first letters of the first and last words,
 * upper-cased for the given locale ("Jana Nováková" → "JN", "ľubo" → "Ľ").
 * Counts by code point, so a name starting with an emoji stays whole.
 * @param name - a person's or a club's name
 * @param locale - a BCP 47 tag for upper-casing (tr, sk…); the runtime's by default
 * @returns one or two characters, or an empty string for a blank name
 */
export function initialsOf(name: string, locale?: string): string {
  const words = name
    .trim()
    .split(/\s+/u)
    .filter((word) => word !== '');
  const first = words.at(0);
  const last = words.length > 1 ? words.at(-1) : undefined;
  const letter = (word: string | undefined): string =>
    word === undefined ? '' : (Array.from(word)[0] ?? '');
  return `${letter(first)}${letter(last)}`.toLocaleUpperCase(locale);
}
