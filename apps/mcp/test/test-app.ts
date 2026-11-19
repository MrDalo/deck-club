import 'reflect-metadata';
import {
  type Card,
  CLIENT_NAME_HEADER,
  IDEMPOTENCY_KEY_HEADER,
  IDEMPOTENT_REPLAYED_HEADER,
} from '@deck-club/contracts';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import type { FetchFunction } from '../src/common/http/fetch-function.js';
import { ENV, loadEnv } from '../src/config/env.js';
import { DeckClubApiClient } from '../src/infra/deck-club-api/deck-club-api-client.js';
import { ACCESS_TOKEN_VERIFIER } from '../src/modules/auth/application/ports/access-token-verifier.js';
import { AUTHORIZATION_SERVER } from '../src/modules/auth/application/ports/authorization-server.js';
import { FakeAccessTokenVerifier } from '../src/modules/auth/testing/fake-access-token-verifier.js';
import { FakeAuthorizationServer } from '../src/modules/auth/testing/fake-authorization-server.js';
import { testCard, testDeck } from '../src/modules/decks/testing/fake-decks-api.js';

/** The public URL the test server claims; the resource identifier in OAuth metadata. */
export const PUBLIC_MCP_URL = 'https://mcp.deck.club/mcp';

/** Tokens the fake verifier accepts: Ana connected through OAuth, Ben pasted a session token. */
export const TOKENS = { ana: 'token-ana', ben: 'token-ben' } as const;

/** The deck the fake core API answers `GET /decks` with. */
export const API_DECK = testDeck({
  id: '00000000-0000-4000-8000-0000000000a1',
  title: 'Spanish verbs',
  language: 'es',
  cardCount: 30,
});

/** The cards of {@link API_DECK}: 30, so `get_deck` has two pages. */
export const API_CARDS = Array.from({ length: 30 }, (_, index) =>
  testCard({
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    deckId: API_DECK.id,
    front: `front ${index + 1}`,
    back: `back ${index + 1}`,
    provenance:
      index === 0 ? { source: 'mcp', clientName: 'Claude' } : { source: 'app', clientName: null },
  }),
);

const DECK_NOT_FOUND = {
  type: 'about:blank',
  title: 'DECK_NOT_FOUND',
  status: 404,
  code: 'DECK_NOT_FOUND',
  detail: 'No deck with that id exists in your library.',
  traceId: 'trace-test',
};

/** What the fake API's writes changed in {@link API_DECK}, until a test resets it. */
type DeckWrites = {
  /** Cards add_cards wrote. */
  added: Card[];
  /** Cards update_card changed, by id. */
  updated: Map<string, Card>;
  /** Ids delete_cards deleted. */
  deleted: Set<string>;
};

/** The deck's cards as the fake API holds them now: seeded, added, edited, without the deleted. */
const cardsNow = (writes: DeckWrites): Card[] =>
  [...API_CARDS, ...writes.added]
    .filter((card) => !writes.deleted.has(card.id))
    .map((card) => writes.updated.get(card.id) ?? card);

const CARD_NOT_FOUND = {
  type: 'about:blank',
  title: 'CARD_NOT_FOUND',
  status: 404,
  code: 'CARD_NOT_FOUND',
  detail: 'No card with that id exists in this deck.',
  traceId: 'trace-test',
};

/**
 * The core API's deck endpoints as the fake answers them: Ana owns
 * {@link API_DECK}; anyone else gets an empty library and 404 for it. What
 * the writes change is kept in `writes` until the test resets it.
 */
function deckEndpoints(url: URL, init: RequestInit, writes: DeckWrites): Response {
  const isAna = new Headers(init.headers).get('authorization') === `Bearer ${TOKENS.ana}`;
  if (url.pathname === '/cards/search') return searchEndpoint(url, isAna);
  if (url.pathname === '/decks' && init.method === 'POST') return createDeckEndpoint(init);
  if (url.pathname === '/decks') return Response.json({ decks: isAna ? [API_DECK] : [] });
  if (!isAna || !url.pathname.startsWith(`/decks/${API_DECK.id}`))
    return Response.json(DECK_NOT_FOUND, { status: 404 });
  if (url.pathname.endsWith('/cards/batch') && init.method === 'POST')
    return addCardsEndpoint(init, writes.added);
  if (init.method === 'PATCH') return updateCardEndpoint(url, init, writes);
  if (init.method === 'DELETE') return deleteCardEndpoint(url, writes);
  return url.pathname.endsWith('/cards')
    ? Response.json({ cards: cardsNow(writes) })
    : Response.json({ ...API_DECK, cardCount: cardsNow(writes).length });
}

/**
 * `GET /study/due` as the fake answers it: every card of {@link API_DECK}
 * is new and due for Ana, in the order added, cut to `limit`; anyone else
 * has nothing due, and a deck that is not theirs is 404, like the API.
 */
function dueCardsEndpoint(url: URL, init: RequestInit): Response {
  const isAna = new Headers(init.headers).get('authorization') === `Bearer ${TOKENS.ana}`;
  const deckId = url.searchParams.get('deckId');
  if (deckId !== null && (!isAna || deckId !== API_DECK.id))
    return Response.json(DECK_NOT_FOUND, { status: 404 });
  const due = isAna ? API_CARDS : [];
  const limit = Number(url.searchParams.get('limit') ?? 20);
  return Response.json({
    cards: due.slice(0, limit).map((card) => ({
      deckId: API_DECK.id,
      deckTitle: API_DECK.title,
      cardId: card.id,
      direction: 'forward',
      cardType: card.type,
      state: 'new',
      prompt: card.front,
      answer: card.back,
      extra: card.extra,
      nextDue: {
        again: '2026-11-17T10:01:00.000Z',
        hard: '2026-11-17T10:06:00.000Z',
        good: '2026-11-17T10:10:00.000Z',
        easy: '2026-11-20T10:00:00.000Z',
      },
    })),
    totalDue: due.length,
  });
}

/**
 * `GET /study/stats` and `GET /study/today` as the fake answers them: Ana
 * has a streak, a weak card (the first of {@link API_CARDS}) and cards due
 * in {@link API_DECK}; anyone else has not started.
 */
function statsEndpoint(url: URL, init: RequestInit): Response {
  const isAna = new Headers(init.headers).get('authorization') === `Bearer ${TOKENS.ana}`;
  if (url.pathname === '/study/today')
    return Response.json({
      decks: isAna
        ? [{ deckId: API_DECK.id, title: API_DECK.title, dueReviews: 4, newCards: 6 }]
        : [],
      totals: isAna ? { dueReviews: 4, newCards: 6 } : { dueReviews: 0, newCards: 0 },
      reviewedToday: isAna ? 10 : 0,
      streakDays: isAna ? 3 : 0,
    });
  const [weak] = API_CARDS;
  return Response.json({
    streakDays: isAna ? 3 : 0,
    reviewedToday: isAna ? 10 : 0,
    totalReviews: isAna ? 120 : 0,
    retention30d: isAna ? 0.85 : null,
    weakCards:
      isAna && weak !== undefined
        ? [
            {
              deckId: API_DECK.id,
              deckTitle: API_DECK.title,
              cardId: weak.id,
              direction: 'forward',
              cardType: weak.type,
              prompt: weak.front,
              answer: weak.back,
              extra: weak.extra,
              forgotten: 4,
              lastForgottenAt: '2026-11-16T10:00:00.000Z',
            },
          ]
        : [],
  });
}

/** The club Ana owns, sharing {@link API_DECK}. */
export const API_CLUB = {
  id: '00000000-0000-4000-8000-0000000000b1',
  name: 'Spanish Fridays',
  description: 'We meet on Fridays.',
  visibility: 'private',
  role: 'owner',
  memberCount: 12,
  memberLimit: 100,
  inviteCode: 'FRIDAY-42',
  joinedAt: '2026-11-01T10:00:00.000Z',
  decks: [
    {
      id: API_DECK.id,
      title: API_DECK.title,
      description: API_DECK.description,
      language: API_DECK.language,
      cardCount: API_DECK.cardCount,
    },
  ],
} as const;

/** `GET /clubs` as the fake answers it: Ana owns {@link API_CLUB}; anyone else is in no club. */
function clubsEndpoint(init: RequestInit): Response {
  const isAna = new Headers(init.headers).get('authorization') === `Bearer ${TOKENS.ana}`;
  return Response.json({ clubs: isAna ? [API_CLUB] : [] });
}

/** A review the fake API recorded, with the headers it came with. */
type RecordedTestReview = {
  body: { deckId: string; cardId: string; direction: string; rating: string };
  clientName: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * `POST /study/reviews` as the fake answers it: Ana may rate the cards of
 * {@link API_DECK}, the reverse side only of a reversible card; the card
 * comes back a day later, in review. Anyone else's deck is 404, like the API.
 */
function reviewEndpoint(init: RequestInit, reviews: RecordedTestReview[]): Response {
  const body = jsonBody(init) as RecordedTestReview['body'];
  const headers = new Headers(init.headers);
  const isAna = headers.get('authorization') === `Bearer ${TOKENS.ana}`;
  if (!isAna || body.deckId !== API_DECK.id) return Response.json(DECK_NOT_FOUND, { status: 404 });
  const card = API_CARDS.find((each) => each.id === body.cardId);
  if (card === undefined) return Response.json(CARD_NOT_FOUND, { status: 404 });
  if (body.direction === 'reverse' && card.type !== 'reversible')
    return Response.json(
      {
        type: 'about:blank',
        title: 'DIRECTION_NOT_STUDIED',
        status: 422,
        code: 'DIRECTION_NOT_STUDIED',
        detail: 'Only reversible cards are studied in the reverse direction.',
        traceId: 'trace-test',
      },
      { status: 422 },
    );
  reviews.push({ body, clientName: headers.get(CLIENT_NAME_HEADER) });
  return Response.json(
    {
      reviewId: `00000000-0000-4000-8000-${String(600 + reviews.length).padStart(12, '0')}`,
      cardId: card.id,
      direction: body.direction,
      rating: body.rating,
      state: body.rating === 'again' ? 'learning' : 'review',
      nextDueAt: new Date(Date.now() + DAY_MS).toISOString(),
    },
    { status: 201 },
  );
}

/**
 * `DELETE /decks/:deckId/cards/:cardId` as the fake answers it: 204, and
 * the card is gone from every later read; a card not there is 404.
 */
function deleteCardEndpoint(url: URL, writes: DeckWrites): Response {
  const cardId = url.pathname.split('/').at(-1) ?? '';
  if (!cardsNow(writes).some((card) => card.id === cardId))
    return Response.json(CARD_NOT_FOUND, { status: 404 });
  writes.deleted.add(cardId);
  return new Response(null, { status: 204 });
}

/**
 * `PATCH /decks/:deckId/cards/:cardId` as the fake answers it: the given
 * fields replace the card's, the rest is kept; an unknown card is 404.
 */
function updateCardEndpoint(url: URL, init: RequestInit, writes: DeckWrites): Response {
  const cardId = url.pathname.split('/').at(-1);
  const current = cardsNow(writes).find((card) => card.id === cardId);
  if (current === undefined) return Response.json(CARD_NOT_FOUND, { status: 404 });
  const patch = jsonBody(init) as Partial<Pick<Card, 'front' | 'back' | 'extra' | 'tags'>>;
  const updated = { ...current, ...patch };
  writes.updated.set(current.id, updated);
  return Response.json(updated);
}

/**
 * `GET /cards/search` as the fake answers it: one hit for Ana, nothing for
 * anyone else, 404 for a deck filter that is not the caller's. The matching
 * rule itself is the API's and is tested there.
 */
function searchEndpoint(url: URL, isAna: boolean): Response {
  const deckId = url.searchParams.get('deckId');
  if (deckId !== null && (!isAna || deckId !== API_DECK.id))
    return Response.json(DECK_NOT_FOUND, { status: 404 });
  const hits = isAna
    ? [{ card: API_CARDS[0], deckTitle: API_DECK.title, matchedIn: ['front'] }]
    : [];
  return Response.json({ hits, totalMatches: hits.length });
}

/** The JSON body of a request the API client sent; it only ever sends JSON text. */
const jsonBody = (init: RequestInit): unknown =>
  typeof init.body === 'string' ? JSON.parse(init.body) : undefined;

/** `POST /decks` as the fake answers it: a new private deck from the body it was sent. */
function createDeckEndpoint(init: RequestInit): Response {
  const body = jsonBody(init) as {
    title: string;
    description: string;
    language: string;
    tags: string[];
  };
  return Response.json(testDeck({ id: '00000000-0000-4000-8000-0000000000c1', ...body }), {
    status: 201,
  });
}

/**
 * `POST /decks/:deckId/cards/batch` as the fake answers it: the cards it was
 * sent, with ids, stamped with the AI client the MCP server named.
 */
function addCardsEndpoint(init: RequestInit, added: Card[]): Response {
  const body = jsonBody(init) as {
    cards: Pick<Card, 'type' | 'front' | 'back' | 'extra' | 'tags'>[];
  };
  const clientName = new Headers(init.headers).get(CLIENT_NAME_HEADER);
  const cards = body.cards.map((card, index) =>
    testCard({
      ...card,
      id: `00000000-0000-4000-8000-${String(800 + added.length + index + 1).padStart(12, '0')}`,
      deckId: API_DECK.id,
      provenance: { source: 'mcp', clientName },
    }),
  );
  added.push(...cards);
  return Response.json({ cards }, { status: 201 });
}

/** A write the fake API answered, kept per user and idempotency key. */
type AnsweredWrite = { request: string; status: number; body: string };

/**
 * The API's idempotency keys as the fake honours them (ADR 0009): per token
 * and key, the same write again gets the first answer, marked as a replay;
 * another write with the key is refused. Failed writes are not kept.
 */
async function answerOnce(write: {
  url: URL;
  init: RequestInit;
  key: string;
  answered: Map<string, AnsweredWrite>;
  run: () => Response;
}): Promise<Response> {
  const { url, init, key, answered } = write;
  const slot = `${new Headers(init.headers).get('authorization')} ${key}`;
  const request = `${url.pathname} ${typeof init.body === 'string' ? init.body : ''}`;
  const earlier = answered.get(slot);
  if (earlier?.request === request)
    return new Response(earlier.body, {
      status: earlier.status,
      headers: { 'content-type': 'application/json', [IDEMPOTENT_REPLAYED_HEADER]: 'true' },
    });
  if (earlier !== undefined)
    return Response.json(
      {
        type: 'about:blank',
        title: 'IDEMPOTENCY_KEY_REUSED',
        status: 422,
        code: 'IDEMPOTENCY_KEY_REUSED',
        detail: 'This Idempotency-Key was already used for a different request.',
        traceId: 'trace-test',
      },
      { status: 422 },
    );
  const response = write.run();
  if (response.ok)
    answered.set(slot, { request, status: response.status, body: await response.clone().text() });
  return response;
}

/** A running MCP server with its fakes, for driving over real HTTP. */
export type TestServer = {
  app: NestFastifyApplication;
  endpoint: URL;
  origin: string;
  authorizationServer: FakeAuthorizationServer;
  /**
   * The fake API: `addedCards` holds what add_cards wrote, `updatedCards`
   * what update_card changed, `deletedCards` what delete_cards deleted,
   * `reviews` what submit_review recorded,
   * `idempotencyKeys` the key of every write (null
   * without one) and `answered` the writes it remembers per key; reset them
   * with {@link resetWrites} after a test.
   */
  api: {
    healthy: boolean;
    requests: URL[];
    bodies: unknown[];
    addedCards: Card[];
    updatedCards: Map<string, Card>;
    deletedCards: Set<string>;
    /** Reviews submit_review recorded. */
    reviews: RecordedTestReview[];
    idempotencyKeys: (string | null)[];
    answered: Map<string, AnsweredWrite>;
  };
};

/**
 * Forgets every write the fake API made, so the next test sees the seeded
 * deck as it was.
 * @param server - the test server
 */
export function resetWrites(server: TestServer): void {
  server.api.addedCards.length = 0;
  server.api.updatedCards.clear();
  server.api.deletedCards.clear();
  server.api.reviews.length = 0;
  server.api.idempotencyKeys.length = 0;
  server.api.answered.clear();
}

const inAnHour = (): number => Math.floor(Date.now() / 1000) + 3600;

/**
 * The real AppModule with fakes at the edges only: the token verifier,
 * Supabase as authorization server, and the core API's transport. Every
 * module, adapter and use case in between is the production one.
 * @returns the listening server
 */
export async function startTestServer(): Promise<TestServer> {
  const verifier = new FakeAccessTokenVerifier()
    .accept(TOKENS.ana, {
      userId: 'user-ana',
      clientId: 'claude-oauth-client',
      expiresAt: inAnHour(),
    })
    .accept(TOKENS.ben, { userId: 'user-ben', clientId: null, expiresAt: inAnHour() });
  const authorizationServer = new FakeAuthorizationServer();
  const api = {
    healthy: true,
    requests: [] as URL[],
    bodies: [] as unknown[],
    addedCards: [] as Card[],
    updatedCards: new Map<string, Card>(),
    deletedCards: new Set<string>(),
    reviews: [] as RecordedTestReview[],
    idempotencyKeys: [] as (string | null)[],
    answered: new Map<string, AnsweredWrite>(),
  };
  const apiFetch: FetchFunction = (url, init) => {
    api.requests.push(url);
    if (init.body !== undefined) api.bodies.push(jsonBody(init));
    if (!api.healthy) return Promise.reject(new TypeError('fetch failed'));
    if (url.pathname === '/study/due') return Promise.resolve(dueCardsEndpoint(url, init));
    if (url.pathname === '/clubs') return Promise.resolve(clubsEndpoint(init));
    if (url.pathname === '/study/stats' || url.pathname === '/study/today')
      return Promise.resolve(statsEndpoint(url, init));
    if (url.pathname === '/study/reviews' && init.method === 'POST') {
      const key = new Headers(init.headers).get(IDEMPOTENCY_KEY_HEADER);
      api.idempotencyKeys.push(key);
      const write = (): Response => reviewEndpoint(init, api.reviews);
      return key === null
        ? Promise.resolve(write())
        : answerOnce({ url, init, key, answered: api.answered, run: write });
    }
    if (url.pathname.startsWith('/decks') || url.pathname === '/cards/search') {
      const write = (): Response =>
        deckEndpoints(url, init, {
          added: api.addedCards,
          updated: api.updatedCards,
          deleted: api.deletedCards,
        });
      if (init.method !== 'POST') return Promise.resolve(write());
      const key = new Headers(init.headers).get(IDEMPOTENCY_KEY_HEADER);
      api.idempotencyKeys.push(key);
      return key === null
        ? Promise.resolve(write())
        : answerOnce({ url, init, key, answered: api.answered, run: write });
    }
    return Promise.resolve(Response.json({ status: 'ok', service: 'api', version: 'test' }));
  };

  const builder = Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(ENV)
    .useValue(
      loadEnv({
        SUPABASE_URL: 'https://test-project.supabase.co',
        SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
        WEB_PUBLIC_URL: 'https://deck.club',
        MCP_PUBLIC_URL: PUBLIC_MCP_URL,
        GIT_SHA: 'test',
      }),
    )
    .overrideProvider(ACCESS_TOKEN_VERIFIER)
    .useValue(verifier)
    .overrideProvider(AUTHORIZATION_SERVER)
    .useValue(authorizationServer)
    .overrideProvider(DeckClubApiClient)
    .useValue(new DeckClubApiClient('http://api.test', apiFetch));
  const app = (await builder.compile()).createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
    { logger: false },
  );
  await app.listen({ port: 0, host: '127.0.0.1' });
  const origin = await app.getUrl();
  return { app, endpoint: new URL('/mcp', origin), origin, authorizationServer, api };
}

/**
 * Connects a real MCP SDK v2 client.
 * @param endpoint - the server's /mcp URL
 * @param options - token, client name and protocol era
 * @returns the connected client
 */
export async function connectClient(
  endpoint: URL,
  options: { token: string; name?: string; era: 'modern' | 'legacy' },
): Promise<Client> {
  const client = new Client(
    { name: options.name ?? 'claude-code', version: '1.0.0' },
    { versionNegotiation: { mode: options.era === 'modern' ? 'auto' : 'legacy' } },
  );
  await client.connect(
    new StreamableHTTPClientTransport(endpoint, {
      requestInit: { headers: { authorization: `Bearer ${options.token}` } },
    }),
  );
  return client;
}

/**
 * A raw JSON-RPC POST, for what an SDK client never sends.
 * @param endpoint - the server's /mcp URL
 * @param body - the JSON-RPC message
 * @param headers - extra headers
 * @returns the response
 */
export function postJsonRpc(
  endpoint: URL,
  body: unknown,
  headers: Record<string, string> = {},
): Promise<Response> {
  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}
