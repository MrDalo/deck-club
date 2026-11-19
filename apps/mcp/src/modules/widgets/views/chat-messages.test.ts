import { describe, expect, it } from 'vitest';
import {
  ASK_FOR_DUE_QUIZ,
  ASK_FOR_STATS,
  askForHelpWithCard,
  askForNextDueCards,
  askToRate,
  ASK_TO_CREATE_DECK,
  askForCards,
  askForCardsAbout,
  askForCardsFromNotes,
  askForMoreCards,
  askForQuiz,
  askToAddBack,
  askToDeleteRest,
  askToSearch,
  askToUndoCardChange,
} from './chat-messages.js';

describe('chat messages', () => {
  it('ask the assistant in the user’s own words, naming the deck', () => {
    expect(askForCards('Biology')).toBe('Add 10 new cards to my "Biology" deck.');
    expect(askForQuiz('Biology')).toBe('Quiz me on my "Biology" deck.');
    expect(ASK_FOR_DUE_QUIZ).toBe('Quiz me on my due cards.');
    expect(askToRate('hablar', 'good')).toBe('Mark my card "hablar" as "good".');
    expect(askForHelpWithCard('hablar')).toBe(
      'Help me remember my card "hablar": I keep forgetting it.',
    );
    expect(ASK_FOR_STATS).toBe('Show me my Deck Club stats.');
    expect(askForNextDueCards(null)).toBe('Show me my next due cards.');
    expect(askForNextDueCards('Biology')).toBe('Show me my next due cards in my "Biology" deck.');
    expect(askForMoreCards('Biology')).toBe('Show me the next cards of my "Biology" deck.');
    expect(askForCardsAbout('mitosis')).toBe('Make 10 cards about "mitosis".');
    expect(askToSearch('mitosis')).toBe('Search my cards for "mitosis".');
    expect(askToAddBack('Biology', 3)).toBe(
      'Add the 3 cards you just deleted back to my "Biology" deck as new cards.',
    );
    expect(askToAddBack('Biology', 1)).toBe(
      'Add the card you just deleted back to my "Biology" deck as new cards.',
    );
    expect(askToDeleteRest('Biology', 2)).toBe(
      'Try again to delete the 2 cards you could not delete from my "Biology" deck.',
    );
    expect(askToUndoCardChange('hablar')).toBe(
      'Change my card "hablar" back to how it was before your edit.',
    );
    expect(askForCardsFromNotes('Biology')).toBe(
      'Turn my notes into cards for my "Biology" deck. I will paste them next.',
    );
  });

  it('ask for a first deck when there is none', () => {
    expect(ASK_TO_CREATE_DECK).toContain('Create a deck');
  });
});
