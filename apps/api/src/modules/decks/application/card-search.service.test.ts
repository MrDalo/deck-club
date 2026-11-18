import type { CreateCardCommand } from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import { createDecksTestKit } from '../testing/decks-test-kit.js';

const card = (front: string, back: string, tags: string[] = []): CreateCardCommand => ({
  type: 'basic',
  front,
  back,
  extra: '',
  tags,
});

async function libraryKit() {
  const kit = createDecksTestKit();
  const deck = (title: string, owner = 'ana') =>
    kit.deckService.create(owner, { title, description: '', language: 'es', tags: [] });
  const add = (owner: string, deckId: string, commands: CreateCardCommand[]) =>
    kit.cardService.add({
      userId: owner,
      deckId,
      commands,
      provenance: { source: 'app', clientName: null },
    });
  const spanish = await deck('Spanish');
  const verbs = await deck('Verbs');
  const bens = await deck('Ben’s deck', 'ben');
  await add('ana', spanish.id, [card('hablar', 'to speak'), card('comer', 'to eat')]);
  await add('ana', verbs.id, [card('to speak', 'hablar', ['verbs']), card('Hablar', 'to talk')]);
  await add('ben', bens.id, [card('hablar', 'Ben’s card')]);
  return { ...kit, spanish, verbs, bens };
}

describe('CardSearchService', () => {
  it('finds matches across all of the user’s decks, best first, with their deck', async () => {
    const { cardSearchService } = await libraryKit();

    const result = await cardSearchService.search('ana', { q: 'hablar', limit: 20 });

    expect(result.totalMatches).toBe(3);
    expect(result.hits.map((hit) => [hit.card.front, hit.deckTitle])).toEqual([
      ['hablar', 'Spanish'],
      ['Hablar', 'Verbs'],
      ['to speak', 'Verbs'],
    ]);
    expect(result.hits[2]?.matchedIn).toEqual(['back']);
  });

  it('never returns another user’s cards', async () => {
    const { cardSearchService } = await libraryKit();

    const result = await cardSearchService.search('ana', { q: 'Ben', limit: 20 });

    expect(result).toEqual({ hits: [], totalMatches: 0 });
  });

  it('searches only the deck it is given', async () => {
    const { cardSearchService, verbs } = await libraryKit();

    const result = await cardSearchService.search('ana', {
      q: 'hablar',
      deckId: verbs.id,
      limit: 20,
    });

    expect(result.hits.every((hit) => hit.card.deckId === verbs.id)).toBe(true);
    expect(result.totalMatches).toBe(2);
  });

  it('returns at most the limit, and says how many matched in total', async () => {
    const { cardSearchService } = await libraryKit();

    const result = await cardSearchService.search('ana', { q: 'hablar', limit: 1 });

    expect(result.hits).toHaveLength(1);
    expect(result.totalMatches).toBe(3);
  });

  it('rejects a deck filter that names another user’s deck with DECK_NOT_FOUND', async () => {
    const { cardSearchService, bens } = await libraryKit();

    await expect(
      cardSearchService.search('ana', { q: 'hablar', deckId: bens.id, limit: 20 }),
    ).rejects.toMatchObject({ code: 'DECK_NOT_FOUND' });
  });

  it('does not find soft-deleted cards', async () => {
    const { cardSearchService, cardService, spanish } = await libraryKit();
    const [first] = await cardService.list('ana', spanish.id);
    await cardService.remove('ana', { deckId: spanish.id, cardId: first!.id });

    const result = await cardSearchService.search('ana', { q: 'to speak', limit: 20 });

    expect(result.hits.map((hit) => [hit.card.front, hit.deckTitle])).toEqual([
      ['to speak', 'Verbs'],
    ]);
  });
});
