/** Folds a character the way a search compares it: no accents, lower case. */
const fold = (character: string): string =>
  character.normalize('NFKD').replaceAll(/\p{M}/gu, '').toLowerCase();

/**
 * The words of a search, folded, for marking. Presentation only: which cards
 * match is the API's call; this marks the words on screen. Mirrors the MCP
 * views (apps/mcp/src/modules/widgets/views/highlight.ts).
 * @param query - the search as typed
 * @returns its distinct words
 */
export function markTermsOf(query: string): string[] {
  return [
    ...new Set(
      fold(query)
        .split(/\s+/)
        .filter((term) => term !== ''),
    ),
  ];
}

/** A run of text, marked or not. */
export type MarkSegment = { text: string; marked: boolean };

/** Which original characters fall inside a found word, comparing folded text. */
function markedCharacters(characters: readonly string[], terms: readonly string[]): boolean[] {
  let folded = '';
  const origins: number[] = [];
  characters.forEach((character, index) => {
    const piece = fold(character);
    folded += piece;
    origins.push(...Array.from({ length: piece.length }, () => index));
  });
  const marked = characters.map(() => false);
  for (const term of terms)
    for (let start = folded.indexOf(term); start !== -1; start = folded.indexOf(term, start + 1))
      for (let offset = 0; offset < term.length; offset += 1) {
        const origin = origins[start + offset];
        if (origin !== undefined) marked[origin] = true;
      }
  return marked;
}

/**
 * Splits text into marked and unmarked runs: every occurrence of every search
 * word, whatever its case and accents ("cafe" marks "Café"); overlapping
 * words join into one run. The text itself is kept as written.
 * @param text - card text
 * @param terms - folded words from {@link markTermsOf}
 * @returns the runs, in order
 */
export function markSegments(text: string, terms: readonly string[]): MarkSegment[] {
  const characters = [...text];
  const marked = markedCharacters(characters, terms);
  const segments: MarkSegment[] = [];
  characters.forEach((character, index) => {
    const isMarked = marked[index] === true;
    const last = segments.at(-1);
    if (last?.marked === isMarked) last.text += character;
    else segments.push({ text: character, marked: isMarked });
  });
  return segments;
}
