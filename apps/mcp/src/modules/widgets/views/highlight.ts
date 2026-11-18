import { escapeHtml } from './escape-html.js';

/** Folds a character the way a search compares it: no accents, lower case. */
const fold = (character: string): string =>
  character.normalize('NFKD').replaceAll(/\p{M}/gu, '').toLowerCase();

/**
 * The words of a search, folded, for highlighting. Presentation only: which
 * cards match is decided by the API, this just marks the words on screen.
 * @param query - the search as typed
 * @returns its distinct words
 */
export function highlightTermsOf(query: string): string[] {
  return [
    ...new Set(
      fold(query)
        .split(/\s+/)
        .filter((term) => term !== ''),
    ),
  ];
}

/**
 * The folded text, and for each of its UTF-16 code units (what `indexOf`
 * counts) the original character it came from.
 */
function foldWithOrigins(characters: readonly string[]): { folded: string; origins: number[] } {
  let folded = '';
  const origins: number[] = [];
  characters.forEach((character, index) => {
    const piece = fold(character);
    folded += piece;
    origins.push(...Array.from({ length: piece.length }, () => index));
  });
  return { folded, origins };
}

/** Which original characters fall inside a found word. */
function markedCharacters(characters: readonly string[], terms: readonly string[]): boolean[] {
  const marked = characters.map(() => false);
  const { folded, origins } = foldWithOrigins(characters);
  for (const term of terms) {
    for (let start = folded.indexOf(term); start !== -1; start = folded.indexOf(term, start + 1)) {
      for (let offset = 0; offset < term.length; offset += 1) {
        const origin = origins[start + offset];
        if (origin !== undefined) marked[origin] = true;
      }
    }
  }
  return marked;
}

/**
 * Escapes text and wraps each occurrence of a search word in `<mark>`,
 * ignoring case and accents like the search itself ("cafe" marks "Café").
 * @param text - card text
 * @param terms - folded words from {@link highlightTermsOf}
 * @returns safe HTML
 */
export function highlight(text: string, terms: readonly string[]): string {
  const characters = [...text];
  const marked = markedCharacters(characters, terms);
  let html = '';
  let open = false;
  characters.forEach((character, index) => {
    if (marked[index] === true && !open) html += '<mark>';
    if (marked[index] !== true && open) html += '</mark>';
    open = marked[index] === true;
    html += escapeHtml(character);
  });
  return open ? `${html}</mark>` : html;
}
