import type { CardSearchField } from '@deck-club/contracts';
import type { Card } from './card.js';

/** A search uses at most this many words; more add cost, not precision. */
const MAX_TERMS = 10;

/** How much a word found in each field counts: the front is what a card is about. */
const FIELD_WEIGHTS: Readonly<Record<CardSearchField, number>> = {
  front: 3,
  back: 2,
  tags: 2,
  extra: 1,
};

/** The whole search found as written on the front or back. */
const PHRASE_BONUS = 5;

/** A front identical to the search: the strongest duplicate signal (spec 4.3). */
const SAME_FRONT_BONUS = 10;

/** A parsed search: the normalised phrase and its distinct words. */
export type SearchQuery = {
  phrase: string;
  terms: string[];
};

/** A card that matched, how well, and where. */
export type CardMatch = {
  card: Card;
  score: number;
  matchedIn: CardSearchField[];
};

/**
 * The form text is compared in: accents removed ("café" → "cafe"), lower
 * case, runs of whitespace collapsed. Card content may be in any language
 * (spec 11), so this uses Unicode decomposition, not an ASCII table.
 * @param text - text as written
 * @returns the comparable form
 */
export function normalizeSearchText(text: string): string {
  return text
    .normalize('NFKD')
    .replaceAll(/\p{M}/gu, '')
    .toLowerCase()
    .replaceAll(/\s+/g, ' ')
    .trim();
}

/**
 * Splits a search into the words every match must contain.
 * @param raw - the search as typed
 * @returns the phrase and up to ten distinct words
 */
export function parseSearchQuery(raw: string): SearchQuery {
  const phrase = normalizeSearchText(raw);
  const terms = [...new Set(phrase.split(' ').filter((term) => term !== ''))].slice(0, MAX_TERMS);
  return { phrase, terms };
}

const fieldsOf = (card: Card): Record<CardSearchField, string> => ({
  front: normalizeSearchText(card.front),
  back: normalizeSearchText(card.back),
  extra: normalizeSearchText(card.extra),
  tags: normalizeSearchText(card.tags.join(' ')),
});

/**
 * Whether a card matches a search: every word must appear somewhere on the
 * card (front, back, extra or tags), ignoring case and accents. The score
 * ranks cards whose front carries the words above those that only mention
 * them, and puts a card whose front is the search itself first — the card
 * the user is about to write twice.
 * @param card - a live card
 * @param query - the parsed search
 * @returns the match, or null when a word is missing (or the search has no words)
 */
export function matchCard(card: Card, query: SearchQuery): CardMatch | null {
  if (query.terms.length === 0) return null;
  const fields = fieldsOf(card);
  const names = Object.keys(fields) as CardSearchField[];
  const matchedIn = new Set<CardSearchField>();
  let score = 0;
  for (const term of query.terms) {
    const found = names.filter((name) => fields[name].includes(term));
    if (found.length === 0) return null;
    for (const name of found) matchedIn.add(name);
    score += Math.max(...found.map((name) => FIELD_WEIGHTS[name]));
  }
  if (fields.front.includes(query.phrase) || fields.back.includes(query.phrase))
    score += PHRASE_BONUS;
  if (fields.front === query.phrase) score += SAME_FRONT_BONUS;
  return { card, score, matchedIn: names.filter((name) => matchedIn.has(name)) };
}

/**
 * Orders matches best first; equal scores keep the order cards were added,
 * so results are stable between searches.
 * @param left - one match
 * @param right - another
 * @returns a sort comparison
 */
export function compareMatches(left: CardMatch, right: CardMatch): number {
  return (
    right.score - left.score ||
    left.card.createdAt.getTime() - right.card.createdAt.getTime() ||
    left.card.id.localeCompare(right.card.id)
  );
}
