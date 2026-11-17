import type { CreateCardCommand } from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import { createDecksTestKit } from '../testing/decks-test-kit.js';

const appProvenance = { source: 'app', clientName: null } as const;
const basic = (front: string): CreateCardCommand => ({
  type: 'basic',
  front,
  back: `${front} back`,
  extra: '',
  tags: [],
});

async function deckWithKit() {
  const kit = createDecksTestKit();
  const deck = await kit.deckService.create('user-1', {
    title: 'Biology',
    description: '',
    language: 'en',
    tags: [],
  });
  return { ...kit, deckId: deck.id };
}

describe('CardService', () => {
  it('adds a batch of cards with one shared provenance and counts them on the deck', async () => {
    const { cardService, deckService, deckId } = await deckWithKit();

    const cards = await cardService.add({
      userId: 'user-1',
      deckId,
      commands: [basic('cell'), basic('mitosis')],
      provenance: { source: 'mcp', clientName: 'Claude' },
    });

    expect(cards.map((card) => card.provenance.clientName)).toEqual(['Claude', 'Claude']);
    expect((await deckService.get('user-1', deckId)).cardCount).toBe(2);
  });

  it('rejects adding cards to another user’s deck with DECK_NOT_FOUND', async () => {
    const { cardService, deckId } = await deckWithKit();

    await expect(
      cardService.add({
        userId: 'user-2',
        deckId,
        commands: [basic('x')],
        provenance: appProvenance,
      }),
    ).rejects.toMatchObject({ code: 'DECK_NOT_FOUND' });
  });

  it('lists cards oldest first', async () => {
    const { cardService, clock, deckId } = await deckWithKit();
    await cardService.add({
      userId: 'user-1',
      deckId,
      commands: [basic('first')],
      provenance: appProvenance,
    });
    clock.advance(1000);
    await cardService.add({
      userId: 'user-1',
      deckId,
      commands: [basic('second')],
      provenance: appProvenance,
    });

    const cards = await cardService.list('user-1', deckId);

    expect(cards.map((card) => card.front)).toEqual(['first', 'second']);
  });

  it('edits a card and keeps who created it', async () => {
    const { cardService, deckId } = await deckWithKit();
    const [card] = await cardService.add({
      userId: 'user-1',
      deckId,
      commands: [basic('cell')],
      provenance: { source: 'mcp', clientName: 'Codex' },
    });

    const edited = await cardService.update(
      'user-1',
      { deckId, cardId: card!.id },
      { back: 'the unit of life' },
    );

    expect(edited).toMatchObject({ back: 'the unit of life', provenance: { clientName: 'Codex' } });
  });

  it('rejects editing a card through the wrong deck with CARD_NOT_FOUND', async () => {
    const { cardService, deckService, deckId } = await deckWithKit();
    const otherDeck = await deckService.create('user-1', {
      title: 'Other',
      description: '',
      language: 'en',
      tags: [],
    });
    const [card] = await cardService.add({
      userId: 'user-1',
      deckId,
      commands: [basic('cell')],
      provenance: appProvenance,
    });

    await expect(
      cardService.update('user-1', { deckId: otherDeck.id, cardId: card!.id }, { back: 'x' }),
    ).rejects.toMatchObject({ code: 'CARD_NOT_FOUND' });
  });

  it('soft-deletes a card so the deck count drops', async () => {
    const { cardService, deckService, deckId } = await deckWithKit();
    const [card] = await cardService.add({
      userId: 'user-1',
      deckId,
      commands: [basic('cell')],
      provenance: appProvenance,
    });

    await cardService.remove('user-1', { deckId, cardId: card!.id });

    expect((await deckService.get('user-1', deckId)).cardCount).toBe(0);
  });

  it('rejects deleting an already deleted card with CARD_NOT_FOUND', async () => {
    const { cardService, deckId } = await deckWithKit();
    const [card] = await cardService.add({
      userId: 'user-1',
      deckId,
      commands: [basic('cell')],
      provenance: appProvenance,
    });
    await cardService.remove('user-1', { deckId, cardId: card!.id });

    await expect(cardService.remove('user-1', { deckId, cardId: card!.id })).rejects.toMatchObject({
      code: 'CARD_NOT_FOUND',
    });
  });
});
