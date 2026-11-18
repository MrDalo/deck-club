import { describe, expect, it } from 'vitest';
import {
  ASK_TO_CREATE_DECK,
  askForCards,
  askForCardsAbout,
  askForCardsFromNotes,
  askForMoreCards,
  askForQuiz,
  askToSearch,
} from './chat-messages.js';

describe('chat messages', () => {
  it('ask the assistant in the user’s own words, naming the deck', () => {
    expect(askForCards('Biology')).toBe('Add 10 new cards to my "Biology" deck.');
    expect(askForQuiz('Biology')).toBe('Quiz me on my "Biology" deck.');
    expect(askForMoreCards('Biology')).toBe('Show me the next cards of my "Biology" deck.');
    expect(askForCardsAbout('mitosis')).toBe('Make 10 cards about "mitosis".');
    expect(askToSearch('mitosis')).toBe('Search my cards for "mitosis".');
    expect(askForCardsFromNotes('Biology')).toBe(
      'Turn my notes into cards for my "Biology" deck. I will paste them next.',
    );
  });

  it('ask for a first deck when there is none', () => {
    expect(ASK_TO_CREATE_DECK).toContain('Create a deck');
  });
});
