import {
  CLIENT_NAME_HEADER,
  type Card,
  type CardList,
  type Deck,
  type DeckList,
  type ProblemDetails,
} from '@deck-club/contracts';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, signedInAs } from './test-app.js';

let app: NestFastifyApplication;

beforeEach(async () => {
  app = await createTestApp();
});

afterEach(async () => {
  await app.close();
});

async function createDeck(userId: string, title = 'Spanish verbs'): Promise<Deck> {
  const response = await app.inject({
    method: 'POST',
    url: '/decks',
    headers: signedInAs(userId),
    payload: { title, language: 'es' },
  });
  expect(response.statusCode).toBe(201);
  return response.json<Deck>();
}

describe('health', () => {
  it('answers without a token', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.json()).toEqual({ status: 'ok', service: 'api', version: 'test' });
  });
});

describe('decks over HTTP, on real SQLite', () => {
  it('rejects a request without a token with UNAUTHENTICATED problem details', async () => {
    const response = await app.inject({ method: 'GET', url: '/decks' });

    expect(response.statusCode).toBe(401);
    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(response.json<ProblemDetails>().code).toBe('UNAUTHENTICATED');
  });

  it('rejects an invalid body with VALIDATION_FAILED and names the field', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/decks',
      headers: signedInAs('ana'),
      payload: { title: '' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json<ProblemDetails>().issues?.[0]?.path).toBe('title');
  });

  it('creates, lists, renames and deletes a deck', async () => {
    const deck = await createDeck('ana');

    const renamed = await app.inject({
      method: 'PATCH',
      url: `/decks/${deck.id}`,
      headers: signedInAs('ana'),
      payload: { title: 'Verbos' },
    });
    expect(renamed.json<Deck>().title).toBe('Verbos');

    const listed = await app.inject({ method: 'GET', url: '/decks', headers: signedInAs('ana') });
    expect(listed.json<DeckList>().decks.map((entry) => entry.title)).toEqual(['Verbos']);

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/decks/${deck.id}`,
      headers: signedInAs('ana'),
    });
    expect(deleted.statusCode).toBe(204);
    const afterDelete = await app.inject({
      method: 'GET',
      url: `/decks/${deck.id}`,
      headers: signedInAs('ana'),
    });
    expect(afterDelete.statusCode).toBe(404);
  });

  it('hides another user’s deck behind DECK_NOT_FOUND', async () => {
    const deck = await createDeck('ana');

    const response = await app.inject({
      method: 'GET',
      url: `/decks/${deck.id}`,
      headers: signedInAs('ben'),
    });

    expect(response.json<ProblemDetails>()).toMatchObject({ status: 404, code: 'DECK_NOT_FOUND' });
  });

  it('treats a malformed deck id as not found', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/decks/not-a-uuid',
      headers: signedInAs('ana'),
    });

    expect(response.json<ProblemDetails>().code).toBe('DECK_NOT_FOUND');
  });
});

describe('cards over HTTP, on real SQLite', () => {
  it('adds a batch through the MCP server and records the AI client as provenance', async () => {
    const deck = await createDeck('ana');

    const response = await app.inject({
      method: 'POST',
      url: `/decks/${deck.id}/cards/batch`,
      headers: { ...signedInAs('ana'), [CLIENT_NAME_HEADER]: 'Claude' },
      payload: {
        cards: [
          { front: 'hablar', back: 'to speak' },
          { front: 'comer', back: 'to eat', type: 'reversible' },
        ],
      },
    });

    expect(response.statusCode).toBe(201);
    const cards = response.json<CardList>().cards;
    expect(cards.map((card) => card.provenance)).toEqual([
      { source: 'mcp', clientName: 'Claude' },
      { source: 'mcp', clientName: 'Claude' },
    ]);
    const reloaded = await app.inject({
      method: 'GET',
      url: `/decks/${deck.id}`,
      headers: signedInAs('ana'),
    });
    expect(reloaded.json<Deck>().cardCount).toBe(2);
  });

  it('round-trips every card field through the database', async () => {
    const deck = await createDeck('ana');
    const created = await app.inject({
      method: 'POST',
      url: `/decks/${deck.id}/cards`,
      headers: signedInAs('ana'),
      payload: {
        type: 'reversible',
        front: 'hablar',
        back: 'to speak',
        extra: 'regular -ar verb',
        tags: ['Verbs'],
      },
    });

    const listed = await app.inject({
      method: 'GET',
      url: `/decks/${deck.id}/cards`,
      headers: signedInAs('ana'),
    });

    expect(listed.json<CardList>().cards).toEqual([created.json<Card>()]);
    expect(created.json<Card>()).toMatchObject({
      type: 'reversible',
      extra: 'regular -ar verb',
      tags: ['verbs'],
      provenance: { source: 'app' },
    });
  });

  it('edits and soft-deletes a card', async () => {
    const deck = await createDeck('ana');
    const card = (
      await app.inject({
        method: 'POST',
        url: `/decks/${deck.id}/cards`,
        headers: signedInAs('ana'),
        payload: { front: 'a', back: 'b' },
      })
    ).json<Card>();

    const edited = await app.inject({
      method: 'PATCH',
      url: `/decks/${deck.id}/cards/${card.id}`,
      headers: signedInAs('ana'),
      payload: { back: 'c' },
    });
    expect(edited.json<Card>().back).toBe('c');

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/decks/${deck.id}/cards/${card.id}`,
      headers: signedInAs('ana'),
    });
    expect(deleted.statusCode).toBe(204);
    const listed = await app.inject({
      method: 'GET',
      url: `/decks/${deck.id}/cards`,
      headers: signedInAs('ana'),
    });
    expect(listed.json<CardList>().cards).toEqual([]);
  });

  it('rejects more than 100 cards in one batch', async () => {
    const deck = await createDeck('ana');
    const cards = Array.from({ length: 101 }, (_, index) => ({ front: `q${index}`, back: 'a' }));

    const response = await app.inject({
      method: 'POST',
      url: `/decks/${deck.id}/cards/batch`,
      headers: signedInAs('ana'),
      payload: { cards },
    });

    expect(response.json<ProblemDetails>().code).toBe('VALIDATION_FAILED');
  });
});
