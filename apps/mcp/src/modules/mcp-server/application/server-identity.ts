import type { Implementation } from '@modelcontextprotocol/server';

/** How the server introduces itself in `server/discover` and `initialize`. */
export const SERVER_INFO: Implementation = {
  name: 'deck-club',
  title: 'Deck Club',
  version: '0.2.0',
};

/**
 * Server-wide guidance for the AI, sent once with the server's identity.
 * Tool descriptions carry the per-tool detail (spec 9, behavior rules).
 */
export const SERVER_INSTRUCTIONS = [
  'Deck Club is the user’s flashcard app with spaced repetition. Deck Club owns the schedule and the data; you act for the user through these tools.',
  'Find a deck’s id with list_decks before working with it; never invent deck or card ids.',
  'To make cards, write one fact per card with a short answer, check for duplicates with search_cards, then call add_cards.',
  'To quiz the user, call get_due_cards, ask one card at a time, judge the answer fairly, and record it with submit_review.',
  'Send a new idempotencyKey (e.g. a UUID) with each create_deck, add_cards and submit_review call, and reuse it only to retry that same call: a retry with the same key never writes twice.',
  'Confirm with the user before deleting anything.',
  'When a tool answers "REJECTED: <CODE>. <detail>", tell the user the detail in plain words; do not retry a refusal unchanged unless its detail tells you to.',
].join(' ');
