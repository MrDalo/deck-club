/**
 * What a view sends to the assistant in the user's name (`ui/message`).
 * Plain requests in the user's own words: the assistant then picks the tool.
 */

/**
 * @param deckTitle - the deck to add to
 * @returns the request for more cards
 */
export function askForCards(deckTitle: string): string {
  return `Add 10 new cards to my "${deckTitle}" deck.`;
}

/** The request when the library is still empty. */
export const ASK_TO_CREATE_DECK = 'Create a deck for me and fill it with 10 cards.';

/**
 * @param deckTitle - the deck to study
 * @returns the request for an in-chat quiz (spec 4.5)
 */
export function askForQuiz(deckTitle: string): string {
  return `Quiz me on my "${deckTitle}" deck.`;
}

/**
 * For hosts that do not let a view call the server itself.
 * @param deckTitle - the deck being read
 * @returns the request for the next page of cards
 */
export function askForMoreCards(deckTitle: string): string {
  return `Show me the next cards of my "${deckTitle}" deck.`;
}

/**
 * When a search found nothing: the user has no card about it yet.
 * @param query - the search
 * @returns the request for cards about it
 */
export function askForCardsAbout(query: string): string {
  return `Make 10 cards about "${query}".`;
}

/**
 * For hosts that do not let a view call the server itself.
 * @param query - the new search
 * @returns the request to search again
 */
export function askToSearch(query: string): string {
  return `Search my cards for "${query}".`;
}

/**
 * After a deck is created: the user will paste their own material next.
 * @param deckTitle - the new deck
 * @returns the request to turn notes into cards
 */
export function askForCardsFromNotes(deckTitle: string): string {
  return `Turn my notes into cards for my "${deckTitle}" deck. I will paste them next.`;
}
