import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { CARD_LIMITS } from './card.js';
import {
  AddCardsOutputSchema,
  AddCardsToolInputSchema,
  CreateBattleToolInputSchema,
  CreateDeckOutputSchema,
  CreateDeckToolInputSchema,
  DeleteCardsOutputSchema,
  DeleteCardsToolInputSchema,
  GetDeckToolInputSchema,
  GetDueCardsOutputSchema,
  GetDueCardsToolInputSchema,
  GetStatsOutputSchema,
  IdempotencyKeySchema,
  ListClubsOutputSchema,
  MCP_SCOPES,
  MCP_TOOL_NAMES,
  MCP_TOOL_SCOPES,
  DECK_PAGE_SIZE,
  GetDeckOutputSchema,
  ListDecksOutputSchema,
  SearchCardsOutputSchema,
  SearchCardsToolInputSchema,
  SubmitReviewOutputSchema,
  SubmitReviewToolInputSchema,
  UpdateCardOutputSchema,
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

describe('GetDueCardsOutputSchema', () => {
  const card = {
    deckId: DECK_ID,
    deckTitle: 'Spanish verbs',
    cardId: CARD_ID,
    direction: 'forward',
    cardType: 'basic',
    state: 'new',
    prompt: 'hablar',
    answer: 'to speak',
    extra: '',
    nextDue: {
      again: '2026-11-17T10:01:00.000Z',
      hard: '2026-11-17T10:06:00.000Z',
      good: '2026-11-17T10:10:00.000Z',
      easy: '2026-11-20T10:00:00.000Z',
    },
  };
  const session = {
    deck: null,
    cards: [card],
    totalDue: 12,
    libraryUrl: 'https://deck.club/decks',
    asOf: '2026-11-17T10:00:00.000Z',
  };

  it('accepts the first cards of a session across every deck', () => {
    expect(GetDueCardsOutputSchema.parse(session)).toEqual(session);
  });

  it('accepts a session limited to one deck with nothing due', () => {
    expect(
      GetDueCardsOutputSchema.safeParse({
        ...session,
        deck: {
          id: DECK_ID,
          title: 'Spanish verbs',
          url: 'https://deck.club/decks/x',
          cardCount: 0,
        },
        cards: [],
        totalDue: 0,
      }).success,
    ).toBe(true);
  });

  it('keeps when each rating brings the card back, for the view’s rating buttons', () => {
    expect(GetDueCardsOutputSchema.parse(session).cards[0]?.nextDue.easy).toBe(
      '2026-11-20T10:00:00.000Z',
    );
  });

  it('rejects a result without the time its hints count from', () => {
    const { asOf: _asOf, ...withoutTime } = session;

    expect(GetDueCardsOutputSchema.safeParse(withoutTime).success).toBe(false);
  });

  it('rejects a study state FSRS does not have', () => {
    expect(
      GetDueCardsOutputSchema.safeParse({ ...session, cards: [{ ...card, state: 'mastered' }] })
        .success,
    ).toBe(false);
  });

  it('rejects more cards than one request may return', () => {
    const cards = Array.from({ length: 51 }, () => card);

    expect(GetDueCardsOutputSchema.safeParse({ ...session, cards, totalDue: 51 }).success).toBe(
      false,
    );
  });
});

describe('SubmitReviewToolInputSchema', () => {
  it('asks for the forward side unless told otherwise, and needs no key', () => {
    expect(
      SubmitReviewToolInputSchema.parse({ deckId: DECK_ID, cardId: CARD_ID, rating: 'good' }),
    ).toEqual({ deckId: DECK_ID, cardId: CARD_ID, direction: 'forward', rating: 'good' });
  });

  it('accepts an idempotency key, so a retried rating is recorded once', () => {
    expect(
      SubmitReviewToolInputSchema.parse({
        deckId: DECK_ID,
        cardId: CARD_ID,
        direction: 'reverse',
        rating: 'again',
        idempotencyKey: 'review-0001',
      }).idempotencyKey,
    ).toBe('review-0001');
  });

  it('rejects a rating that is not one of the four', () => {
    expect(
      SubmitReviewToolInputSchema.safeParse({ deckId: DECK_ID, cardId: CARD_ID, rating: 'perfect' })
        .success,
    ).toBe(false);
  });

  it('rejects a time over an hour, and a key outside the safe set', () => {
    const review = { deckId: DECK_ID, cardId: CARD_ID, rating: 'good' };

    expect(
      SubmitReviewToolInputSchema.safeParse({ ...review, durationMs: 3_600_001 }).success,
    ).toBe(false);
    expect(
      SubmitReviewToolInputSchema.safeParse({ ...review, idempotencyKey: 'key with spaces' })
        .success,
    ).toBe(false);
  });

  it('describes every argument in the JSON Schema the AI reads', () => {
    const { properties = {} } = z.toJSONSchema(SubmitReviewToolInputSchema, { io: 'input' });

    expect(Object.keys(properties)).toHaveLength(6);
    for (const property of Object.values(properties))
      expect((property as { description?: string }).description?.length).toBeGreaterThan(10);
  });
});

describe('SubmitReviewOutputSchema', () => {
  const recorded = {
    reviewId: '00000000-0000-4000-8000-000000000003',
    deckId: DECK_ID,
    cardId: CARD_ID,
    direction: 'forward',
    rating: 'good',
    state: 'review',
    nextDueAt: '2026-11-20T10:00:00.000Z',
    replayed: false,
    asOf: '2026-11-17T10:00:00.000Z',
  };

  it('accepts a recorded review with when the card comes back', () => {
    expect(SubmitReviewOutputSchema.parse(recorded)).toEqual(recorded);
  });

  it('rejects a review without its deck, which the view needs to match the card', () => {
    const { deckId: _deckId, ...withoutDeck } = recorded;

    expect(SubmitReviewOutputSchema.safeParse(withoutDeck).success).toBe(false);
  });
});

describe('GetStatsOutputSchema', () => {
  const stats = {
    streakDays: 4,
    reviewedToday: 12,
    totalReviews: 230,
    retention30d: 0.87,
    weakCards: [],
    dueToday: { dueReviews: 5, newCards: 3 },
    decksDueToday: [
      {
        id: DECK_ID,
        title: 'Spanish verbs',
        url: `https://deck.club/decks/${DECK_ID}`,
        dueReviews: 5,
        newCards: 3,
      },
    ],
    libraryUrl: 'https://deck.club/decks',
  };

  it('accepts the API’s stats with what is still due today, per deck', () => {
    expect(GetStatsOutputSchema.parse(stats)).toEqual(stats);
  });

  it('accepts a user who has not studied yet', () => {
    expect(
      GetStatsOutputSchema.safeParse({
        ...stats,
        streakDays: 0,
        reviewedToday: 0,
        totalReviews: 0,
        retention30d: null,
        dueToday: { dueReviews: 0, newCards: 0 },
        decksDueToday: [],
      }).success,
    ).toBe(true);
  });

  it('rejects a deck without the link the view opens', () => {
    const [deck] = stats.decksDueToday;

    expect(
      GetStatsOutputSchema.safeParse({ ...stats, decksDueToday: [{ ...deck, url: 'spanish' }] })
        .success,
    ).toBe(false);
  });

  it('rejects a retention outside 0 to 1', () => {
    expect(GetStatsOutputSchema.safeParse({ ...stats, retention30d: 87 }).success).toBe(false);
  });
});

describe('ListClubsOutputSchema', () => {
  const club = {
    id: '00000000-0000-4000-8000-0000000000c1',
    name: 'Spanish Fridays',
    description: '',
    visibility: 'private',
    role: 'member',
    memberCount: 12,
    memberLimit: 100,
    inviteCode: null,
    decks: [
      {
        id: DECK_ID,
        title: 'Spanish verbs',
        description: '',
        language: 'es',
        cardCount: 40,
        url: `https://deck.club/decks/${DECK_ID}`,
      },
    ],
  };
  const list = { clubs: [club], clubCount: 1, libraryUrl: 'https://deck.club/decks' };

  it('accepts clubs whose decks are library tiles the view can open', () => {
    expect(ListClubsOutputSchema.parse(list)).toEqual(list);
  });

  it('accepts a user in no club', () => {
    expect(ListClubsOutputSchema.safeParse({ ...list, clubs: [], clubCount: 0 }).success).toBe(
      true,
    );
  });

  it('rejects a club deck without the link the view needs', () => {
    const { url: _url, ...withoutLink } = club.decks[0]!;

    expect(
      ListClubsOutputSchema.safeParse({ ...list, clubs: [{ ...club, decks: [withoutLink] }] })
        .success,
    ).toBe(false);
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

describe('AddCardsOutputSchema', () => {
  const page = {
    deck: {
      id: DECK_ID,
      title: 'Spanish verbs',
      description: '',
      language: 'es',
      cardCount: 43,
      url: `https://deck.club/decks/${DECK_ID}`,
    },
    cards: [
      {
        id: CARD_ID,
        type: 'basic',
        front: 'hablar',
        back: 'to speak',
        extra: '',
        tags: [],
        addedBy: 'Claude',
      },
    ],
    firstCardNumber: 43,
    nextCursor: null,
  };

  it('accepts a deck page starting at the cards just added, with how many were added', () => {
    const output = { ...page, addedCount: 1 };

    expect(AddCardsOutputSchema.parse(output)).toEqual(output);
  });

  it('is still a get_deck page, so the view can read on with get_deck', () => {
    expect(GetDeckOutputSchema.safeParse({ ...page, addedCount: 1 }).success).toBe(true);
  });

  it('rejects a result that added nothing', () => {
    expect(AddCardsOutputSchema.safeParse({ ...page, addedCount: 0 }).success).toBe(false);
  });

  it('rejects more added cards than one batch may hold', () => {
    expect(
      AddCardsOutputSchema.safeParse({ ...page, addedCount: CARD_LIMITS.perBatch + 1 }).success,
    ).toBe(false);
  });
});

describe('CreateDeckToolInputSchema', () => {
  it('accepts an idempotency key, so a retried create never makes a second deck', () => {
    expect(
      CreateDeckToolInputSchema.parse({ title: 'Biology', idempotencyKey: 'create-key-0001' }),
    ).toEqual({
      title: 'Biology',
      description: '',
      language: 'en',
      tags: [],
      idempotencyKey: 'create-key-0001',
    });
  });

  it('leaves the key out when the AI sends none', () => {
    expect(CreateDeckToolInputSchema.parse({ title: 'Biology' })).not.toHaveProperty(
      'idempotencyKey',
    );
  });

  it('rejects a key outside the safe set', () => {
    expect(
      CreateDeckToolInputSchema.safeParse({ title: 'Biology', idempotencyKey: 'not a key' })
        .success,
    ).toBe(false);
  });
});

describe('UpdateCardOutputSchema', () => {
  const card = {
    id: CARD_ID,
    type: 'basic',
    front: 'hablar',
    back: 'to speak',
    extra: '',
    tags: [],
    addedBy: 'Claude',
  };
  const output = {
    deck: { id: DECK_ID, title: 'Spanish verbs', url: `https://deck.club/decks/${DECK_ID}` },
    card: { ...card, back: 'to speak, to talk' },
    previous: card,
    changedFields: ['back'],
  };

  it('accepts the card as it is now and as it was, with what changed', () => {
    expect(UpdateCardOutputSchema.parse(output)).toEqual(output);
  });

  it('accepts an edit that changed nothing', () => {
    expect(UpdateCardOutputSchema.safeParse({ ...output, card, changedFields: [] }).success).toBe(
      true,
    );
  });

  it('rejects a field update_card cannot change', () => {
    expect(UpdateCardOutputSchema.safeParse({ ...output, changedFields: ['type'] }).success).toBe(
      false,
    );
  });

  it('rejects a result without the card as it was', () => {
    const { previous: _omitted, ...withoutPrevious } = output;

    expect(UpdateCardOutputSchema.safeParse(withoutPrevious).success).toBe(false);
  });
});

describe('DeleteCardsOutputSchema', () => {
  const deleted = {
    id: CARD_ID,
    type: 'basic',
    front: 'hablar',
    back: 'to speak',
    extra: '',
    tags: [],
    addedBy: null,
  };
  const output = {
    deck: {
      id: DECK_ID,
      title: 'Spanish verbs',
      url: `https://deck.club/decks/${DECK_ID}`,
      cardCount: 41,
    },
    deleted: [deleted],
    notFound: [],
    notDeleted: [],
  };

  it('accepts the cards deleted, with the deck’s new count', () => {
    expect(DeleteCardsOutputSchema.parse(output)).toEqual(output);
  });

  it('accepts a call that deleted nothing, with the ids it could not find', () => {
    expect(
      DeleteCardsOutputSchema.safeParse({ ...output, deleted: [], notFound: [CARD_ID] }).success,
    ).toBe(true);
  });

  it('rejects an id that is not a UUID', () => {
    expect(DeleteCardsOutputSchema.safeParse({ ...output, notDeleted: ['card-1'] }).success).toBe(
      false,
    );
  });

  it('rejects more deleted cards than one call may delete', () => {
    const many = Array.from({ length: CARD_LIMITS.perBatch + 1 }, () => deleted);

    expect(DeleteCardsOutputSchema.safeParse({ ...output, deleted: many }).success).toBe(false);
  });
});
