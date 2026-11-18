import { describe, expect, it } from 'vitest';
import { CARD_LIMITS } from './card.js';
import {
  AddCardsToolInputSchema,
  CreateBattleToolInputSchema,
  CreateDeckOutputSchema,
  DeleteCardsToolInputSchema,
  GetDeckToolInputSchema,
  GetDueCardsToolInputSchema,
  IdempotencyKeySchema,
  MCP_SCOPES,
  MCP_TOOL_NAMES,
  MCP_TOOL_SCOPES,
  DECK_PAGE_SIZE,
  GetDeckOutputSchema,
  ListDecksOutputSchema,
  SearchCardsOutputSchema,
  SearchCardsToolInputSchema,
  UpdateCardToolInputSchema,
} from './mcp-tools.js';

const DECK_ID = '00000000-0000-4000-8000-000000000001';
const CARD_ID = '00000000-0000-4000-8000-000000000002';

describe('MCP tool catalogue', () => {
  it('names every product spec 9 tool exactly once', () => {
    expect(new Set(MCP_TOOL_NAMES).size).toBe(MCP_TOOL_NAMES.length);
    expect(MCP_TOOL_NAMES).toHaveLength(13);
  });

  it('gives every tool one of the published scopes', () => {
    for (const name of MCP_TOOL_NAMES) expect(MCP_SCOPES).toContain(MCP_TOOL_SCOPES[name]);
  });

  it('keeps reads on decks:read and writes on decks:write', () => {
    expect(MCP_TOOL_SCOPES.search_cards).toBe('decks:read');
    expect(MCP_TOOL_SCOPES.delete_cards).toBe('decks:write');
  });
});

describe('GetDeckToolInputSchema', () => {
  it('accepts a deck id without a cursor', () => {
    expect(GetDeckToolInputSchema.parse({ deckId: DECK_ID })).toEqual({ deckId: DECK_ID });
  });

  it('rejects a deck id that is not a UUID', () => {
    expect(GetDeckToolInputSchema.safeParse({ deckId: 'spanish' }).success).toBe(false);
  });
});

describe('SearchCardsToolInputSchema', () => {
  it('trims the query and defaults the limit', () => {
    expect(SearchCardsToolInputSchema.parse({ query: '  hablar ' })).toEqual({
      query: 'hablar',
      limit: 20,
    });
  });

  it('rejects a blank query', () => {
    expect(SearchCardsToolInputSchema.safeParse({ query: '   ' }).success).toBe(false);
  });

  it('rejects a limit above 50', () => {
    expect(SearchCardsToolInputSchema.safeParse({ query: 'a', limit: 51 }).success).toBe(false);
  });
});

describe('AddCardsToolInputSchema', () => {
  it('accepts a batch with an idempotency key', () => {
    const parsed = AddCardsToolInputSchema.parse({
      deckId: DECK_ID,
      cards: [{ front: 'hola', back: 'hello' }],
      idempotencyKey: 'retry-key-0001',
    });

    expect(parsed.idempotencyKey).toBe('retry-key-0001');
    expect(parsed.cards[0]?.type).toBe('basic');
  });

  it('rejects more cards than one batch may hold', () => {
    const cards = Array.from({ length: CARD_LIMITS.perBatch + 1 }, () => ({
      front: 'q',
      back: 'a',
    }));

    expect(AddCardsToolInputSchema.safeParse({ deckId: DECK_ID, cards }).success).toBe(false);
  });

  it('rejects HTML smuggled into a card', () => {
    const cards = [{ front: '<script>alert(1)</script>', back: 'a' }];

    expect(AddCardsToolInputSchema.safeParse({ deckId: DECK_ID, cards }).success).toBe(false);
  });
});

describe('IdempotencyKeySchema', () => {
  it('rejects a key that is too short to be unique', () => {
    expect(IdempotencyKeySchema.safeParse('abc').success).toBe(false);
  });

  it('rejects characters outside the safe set', () => {
    expect(IdempotencyKeySchema.safeParse('key with spaces').success).toBe(false);
  });
});

describe('UpdateCardToolInputSchema', () => {
  it('accepts a change to one field', () => {
    const parsed = UpdateCardToolInputSchema.parse({
      deckId: DECK_ID,
      cardId: CARD_ID,
      back: 'hi',
    });

    expect(parsed).toEqual({ deckId: DECK_ID, cardId: CARD_ID, back: 'hi' });
  });

  it('rejects a call that changes nothing', () => {
    expect(UpdateCardToolInputSchema.safeParse({ deckId: DECK_ID, cardId: CARD_ID }).success).toBe(
      false,
    );
  });
});

describe('DeleteCardsToolInputSchema', () => {
  it('rejects an empty list of cards', () => {
    expect(DeleteCardsToolInputSchema.safeParse({ deckId: DECK_ID, cardIds: [] }).success).toBe(
      false,
    );
  });
});

describe('GetDueCardsToolInputSchema', () => {
  it('defaults to ten cards from all decks', () => {
    expect(GetDueCardsToolInputSchema.parse({})).toEqual({ limit: 10 });
  });

  it('rejects more cards than one request may return', () => {
    expect(GetDueCardsToolInputSchema.safeParse({ limit: 51 }).success).toBe(false);
  });
});

describe('CreateBattleToolInputSchema', () => {
  it('fills the spec 8 defaults', () => {
    expect(CreateBattleToolInputSchema.parse({ deckId: DECK_ID })).toEqual({
      deckId: DECK_ID,
      questionCount: 10,
      cardSelection: 'random',
      answerFormat: 'multiple_choice',
      secondsPerQuestion: 20,
      joinPolicy: 'anyone_with_code',
    });
  });

  it('rejects a question count the spec does not offer', () => {
    expect(
      CreateBattleToolInputSchema.safeParse({ deckId: DECK_ID, questionCount: 7 }).success,
    ).toBe(false);
  });

  it('rejects a time limit the spec does not offer', () => {
    expect(
      CreateBattleToolInputSchema.safeParse({ deckId: DECK_ID, secondsPerQuestion: 15 }).success,
    ).toBe(false);
  });
});

describe('ListDecksOutputSchema', () => {
  const deck = {
    id: DECK_ID,
    title: 'Spanish verbs',
    description: 'A1 vocabulary',
    language: 'es',
    cardCount: 42,
    url: 'https://deck.club/decks/' + DECK_ID,
  };

  it('accepts a library the view can render', () => {
    const output = { decks: [deck], deckCount: 1, libraryUrl: 'https://deck.club/decks' };

    expect(ListDecksOutputSchema.parse(output)).toEqual(output);
  });

  it('accepts an empty library', () => {
    expect(
      ListDecksOutputSchema.safeParse({
        decks: [],
        deckCount: 0,
        libraryUrl: 'https://deck.club/decks',
      }).success,
    ).toBe(true);
  });

  it('rejects a deck without the link the view needs', () => {
    const { url: _omitted, ...withoutUrl } = deck;

    expect(
      ListDecksOutputSchema.safeParse({
        decks: [withoutUrl],
        deckCount: 1,
        libraryUrl: 'https://deck.club/decks',
      }).success,
    ).toBe(false);
  });

  it('rejects a negative card count', () => {
    expect(
      ListDecksOutputSchema.safeParse({
        decks: [{ ...deck, cardCount: -1 }],
        deckCount: 1,
        libraryUrl: 'https://deck.club/decks',
      }).success,
    ).toBe(false);
  });
});

describe('GetDeckOutputSchema', () => {
  const deck = {
    id: DECK_ID,
    title: 'Spanish verbs',
    description: '',
    language: 'es',
    cardCount: 1,
    url: `https://deck.club/decks/${DECK_ID}`,
  };
  const card = {
    id: CARD_ID,
    type: 'reversible',
    front: 'hablar',
    back: 'to speak',
    extra: '',
    tags: ['verbs'],
    addedBy: 'Claude',
  };

  it('accepts a deck with a page of cards and no further page', () => {
    const output = { deck, cards: [card], firstCardNumber: 1, nextCursor: null };

    expect(GetDeckOutputSchema.parse(output)).toEqual(output);
  });

  it('accepts a card a person wrote', () => {
    expect(
      GetDeckOutputSchema.safeParse({
        deck,
        cards: [{ ...card, addedBy: null }],
        firstCardNumber: 1,
        nextCursor: 'next',
      }).success,
    ).toBe(true);
  });

  it('rejects a page larger than the page size', () => {
    const cards = Array.from({ length: DECK_PAGE_SIZE + 1 }, () => card);

    expect(
      GetDeckOutputSchema.safeParse({ deck, cards, firstCardNumber: 1, nextCursor: null }).success,
    ).toBe(false);
  });

  it('rejects a card type the app does not have', () => {
    expect(
      GetDeckOutputSchema.safeParse({
        deck,
        cards: [{ ...card, type: 'cloze' }],
        firstCardNumber: 1,
        nextCursor: null,
      }).success,
    ).toBe(false);
  });

  it('counts cards from one', () => {
    expect(
      GetDeckOutputSchema.safeParse({ deck, cards: [], firstCardNumber: 0, nextCursor: null })
        .success,
    ).toBe(false);
  });
});

describe('SearchCardsOutputSchema', () => {
  const match = {
    card: {
      id: CARD_ID,
      type: 'basic',
      front: 'hablar',
      back: 'to speak',
      extra: '',
      tags: [],
      addedBy: null,
    },
    deck: { id: DECK_ID, title: 'Spanish verbs', url: `https://deck.club/decks/${DECK_ID}` },
    matchedIn: ['front'],
  };

  it('accepts matches across every deck', () => {
    const output = { query: 'hablar', deckId: null, matches: [match], totalMatches: 1 };

    expect(SearchCardsOutputSchema.parse(output)).toEqual(output);
  });

  it('accepts a search limited to one deck with no matches', () => {
    expect(
      SearchCardsOutputSchema.safeParse({
        query: 'x',
        deckId: DECK_ID,
        matches: [],
        totalMatches: 0,
      }).success,
    ).toBe(true);
  });

  it('rejects more matches than one search may return', () => {
    const matches = Array.from({ length: 51 }, () => match);

    expect(
      SearchCardsOutputSchema.safeParse({ query: 'x', deckId: null, matches, totalMatches: 51 })
        .success,
    ).toBe(false);
  });
});

describe('CreateDeckOutputSchema', () => {
  const deck = {
    id: DECK_ID,
    title: 'Spanish verbs',
    description: '',
    language: 'es',
    cardCount: 0,
    url: `https://deck.club/decks/${DECK_ID}`,
    tags: ['a1'],
    visibility: 'private',
  };

  it('accepts a new deck with its tags and visibility', () => {
    const output = { deck, libraryUrl: 'https://deck.club/decks' };

    expect(CreateDeckOutputSchema.parse(output)).toEqual(output);
  });

  it('rejects a visibility the app does not have', () => {
    expect(
      CreateDeckOutputSchema.safeParse({
        deck: { ...deck, visibility: 'secret' },
        libraryUrl: 'https://deck.club/decks',
      }).success,
    ).toBe(false);
  });

  it('rejects a deck without its link', () => {
    const { url: _omitted, ...withoutUrl } = deck;

    expect(
      CreateDeckOutputSchema.safeParse({ deck: withoutUrl, libraryUrl: 'https://deck.club/decks' })
        .success,
    ).toBe(false);
  });
});
