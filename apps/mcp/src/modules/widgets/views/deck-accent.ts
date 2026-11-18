/**
 * The pastel highlighter set, in the web app's order
 * (`apps/web/src/features/decks/lib/deck-accent.ts`). The same deck gets the
 * same colour in the browser and in the chat.
 */
const ACCENTS = [
  'var(--color-lilac)',
  'var(--color-mint)',
  'var(--color-peach)',
  'var(--color-sky)',
  'var(--color-butter)',
  'var(--color-rose)',
] as const;

/**
 * A stable pastel for a deck, derived from its id so it never changes.
 * @param deckId - the deck's UUID
 * @returns the CSS colour of its tab
 */
export function deckAccent(deckId: string): string {
  let hash = 0;
  for (const character of deckId) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return ACCENTS[hash % ACCENTS.length] ?? ACCENTS[0];
}
