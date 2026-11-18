import { type CreateDeckOutput, CreateDeckOutputSchema } from '@deck-club/contracts';
import { renderDeckCreated } from '../deck-created-markup.js';
import { startView } from './view-runtime.js';

/**
 * The `create_deck` view: the new deck as its library tile, and the next
 * step. Its buttons ask the assistant for cards or open Deck Club, both
 * handled by the shared runtime.
 */
startView<CreateDeckOutput>({
  name: 'deck-club-deck-created',
  schema: CreateDeckOutputSchema,
  render: renderDeckCreated,
  messages: {
    toolFailed: 'Deck Club did not create the deck. The assistant has the reason.',
    unreadable: 'Deck Club sent a new deck this view could not read. Ask again in a moment.',
  },
});
