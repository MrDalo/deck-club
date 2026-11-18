import 'reflect-metadata';
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

/**
 * The core API's deck endpoints as the fake answers them: Ana owns
 * {@link API_DECK}; anyone else gets an empty library and 404 for it.
 */
function deckEndpoints(url: URL, init: RequestInit): Response {
  const isAna = new Headers(init.headers).get('authorization') === `Bearer ${TOKENS.ana}`;
  if (url.pathname === '/cards/search') return searchEndpoint(url, isAna);
  if (url.pathname === '/decks' && init.method === 'POST') return createDeckEndpoint(init);
  if (url.pathname === '/decks') return Response.json({ decks: isAna ? [API_DECK] : [] });
  if (!isAna || !url.pathname.startsWith(`/decks/${API_DECK.id}`))
    return Response.json(DECK_NOT_FOUND, { status: 404 });
  return url.pathname.endsWith('/cards')
    ? Response.json({ cards: API_CARDS })
    : Response.json(API_DECK);
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

/** A running MCP server with its fakes, for driving over real HTTP. */
export type TestServer = {
  app: NestFastifyApplication;
  endpoint: URL;
  origin: string;
  authorizationServer: FakeAuthorizationServer;
  api: { healthy: boolean; requests: URL[]; bodies: unknown[] };
};

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
  const api = { healthy: true, requests: [] as URL[], bodies: [] as unknown[] };
  const apiFetch: FetchFunction = (url, init) => {
    api.requests.push(url);
    if (init.body !== undefined) api.bodies.push(jsonBody(init));
    if (!api.healthy) return Promise.reject(new TypeError('fetch failed'));
    if (url.pathname.startsWith('/decks') || url.pathname === '/cards/search')
      return Promise.resolve(deckEndpoints(url, init));
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
