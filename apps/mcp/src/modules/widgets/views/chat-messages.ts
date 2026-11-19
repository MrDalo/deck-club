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

/** The request for an in-chat quiz over every deck's due cards (spec 4.5). */
export const ASK_FOR_DUE_QUIZ = 'Quiz me on my due cards.';

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

/**
 * For hosts that do not let a view call the server itself.
 * @param front - the card's front as it is now
 * @returns the request to undo the assistant's edit
 */
export function askToUndoCardChange(front: string): string {
  return `Change my card "${front}" back to how it was before your edit.`;
}

/**
 * For hosts that do not let a view call the server itself.
 * @param deckTitle - the deck the cards were deleted from
 * @param count - how many cards were deleted
 * @returns the request to add the deleted cards back
 */
export function askToAddBack(deckTitle: string, count: number): string {
  return `Add the ${count === 1 ? 'card' : `${count} cards`} you just deleted back to my "${deckTitle}" deck as new cards.`;
}

/**
 * After Deck Club stopped part-way through a delete.
 * @param deckTitle - the deck
 * @param count - how many cards were left alone
 * @returns the request to delete the rest
 */
export function askToDeleteRest(deckTitle: string, count: number): string {
  return `Try again to delete the ${count === 1 ? 'card' : `${count} cards`} you could not delete from my "${deckTitle}" deck.`;
}

/**
 * For hosts that do not let a view call the server itself: the assistant
 * records the rating the user picked in the study view.
 * @param prompt - what the card asked
 * @param rating - the rating the user picked
 * @returns the request to record it
 */
export function askToRate(prompt: string, rating: string): string {
  return `Mark my card "${prompt}" as "${rating}".`;
}

/**
 * For hosts that do not let a view call the server itself.
 * @param deckTitle - the deck the session is limited to, or null for every deck
 * @returns the request for the next due cards
 */
export function askForNextDueCards(deckTitle: string | null): string {
  return deckTitle === null
    ? 'Show me my next due cards.'
    : `Show me my next due cards in my "${deckTitle}" deck.`;
}

/**
 * From the stats: the user wants help with a card they keep forgetting.
 * @param prompt - what the card asks
 * @returns the request for help
 */
export function askForHelpWithCard(prompt: string): string {
  return `Help me remember my card "${prompt}": I keep forgetting it.`;
}

/** For hosts that do not let a view call the server itself: the stats again. */
export const ASK_FOR_STATS = 'Show me my Deck Club stats.';
