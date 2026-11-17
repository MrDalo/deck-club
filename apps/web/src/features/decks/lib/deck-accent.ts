/** A deck's pastel: a Tailwind class for fills and the CSS colour for the highlighter swipe. */
export type DeckAccent = {
  className: string;
  color: string;
};

/** The pastel highlighter set, written out in full so Tailwind sees every class. */
const ACCENTS: readonly DeckAccent[] = [
  { className: 'bg-lilac', color: 'var(--color-lilac)' },
  { className: 'bg-mint', color: 'var(--color-mint)' },
  { className: 'bg-peach', color: 'var(--color-peach)' },
  { className: 'bg-sky', color: 'var(--color-sky)' },
  { className: 'bg-butter', color: 'var(--color-butter)' },
  { className: 'bg-rose', color: 'var(--color-rose)' },
];

const FALLBACK: DeckAccent = { className: 'bg-lilac', color: 'var(--color-lilac)' };

/**
 * A stable pastel for a deck, derived from its id so it never changes between visits.
 * @param deckId - the deck's UUID
 * @returns the deck's accent
 */
export function deckAccent(deckId: string): DeckAccent {
  let hash = 0;
  for (const character of deckId) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return ACCENTS[hash % ACCENTS.length] ?? FALLBACK;
}
