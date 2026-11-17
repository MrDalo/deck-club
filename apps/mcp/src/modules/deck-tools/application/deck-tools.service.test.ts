import type { AddCardsToolInput } from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import { loadEnv } from '../../../config/env.js';
import { FakeDeckClubApi } from '../testing/fake-deck-club-api.js';
import { DeckToolsService } from './deck-tools.service.js';

const caller = { accessToken: 'token-ana', clientName: 'Claude' };

function createService(): { api: FakeDeckClubApi; tools: DeckToolsService } {
  const api = new FakeDeckClubApi();
  return {
    api,
    tools: new DeckToolsService(api, loadEnv({ WEB_PUBLIC_URL: 'https://deck.club' })),
  };
}

describe('DeckToolsService', () => {
  it('guides the AI to create a deck when the library is empty', async () => {
    const { tools } = createService();

    const result = await tools.listDecks(caller);

    expect(result).toEqual({
      isError: false,
      text: expect.stringContaining('create_deck') as string,
    });
  });

  it('creates a deck and returns its id and web link', async () => {
    const { tools } = createService();

    const result = await tools.createDeck(caller, {
      title: 'Spanish',
      description: '',
      language: 'es',
      tags: [],
    });

    expect(result.text).toMatch(/Created deck "Spanish" \(id: [0-9a-f-]{36}\)/);
    expect(result.text).toContain('https://deck.club/decks/');
  });

  it('adds cards and reports how many', async () => {
    const { api, tools } = createService();
    const deck = await api.createDeck(caller, { title: 'Spanish' });
    const cards: AddCardsToolInput['cards'] = [
      { type: 'basic', front: 'hablar', back: 'to speak', extra: '', tags: [] },
      { type: 'reversible', front: 'comer', back: 'to eat', extra: '', tags: [] },
    ];

    const result = await tools.addCards(caller, { deckId: deck.id, cards });

    expect(result).toMatchObject({
      isError: false,
      text: expect.stringContaining('Added 2 cards') as string,
    });
  });

  it('turns an API refusal into a REJECTED tool result instead of throwing', async () => {
    const { tools } = createService();

    const result = await tools.getDeck(caller, { deckId: '00000000-0000-4000-8000-999999999999' });

    expect(result).toEqual({
      isError: true,
      text: 'REJECTED: DECK_NOT_FOUND. No deck with that id exists in your library.',
    });
  });

  it('never shows one user’s decks to another token', async () => {
    const { api, tools } = createService();
    await api.createDeck(caller, { title: 'Private' });

    const result = await tools.listDecks({ accessToken: 'token-ben', clientName: 'Claude' });

    expect(result.text).not.toContain('Private');
  });
});
