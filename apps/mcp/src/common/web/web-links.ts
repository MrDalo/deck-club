/**
 * Where Deck Club's pages live in the web app, so every module links the
 * user to the same place and the views can open it.
 */

/**
 * @param webUrl - the web app's public URL
 * @param deckId - the deck
 * @returns the deck's page
 */
export function deckUrl(webUrl: string, deckId: string): string {
  return new URL(`/decks/${deckId}`, webUrl).toString();
}

/**
 * @param webUrl - the web app's public URL
 * @returns the deck library
 */
export function libraryUrl(webUrl: string): string {
  return new URL('/decks', webUrl).toString();
}
