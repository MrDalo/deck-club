import { describe, expect, it } from 'vitest';
import {
  AddCardsInputSchema,
  CARD_LIMITS,
  CreateCardInputSchema,
  UpdateCardInputSchema,
} from './card.js';

describe('CreateCardInputSchema', () => {
  it('defaults to a basic card with no extra and no tags', () => {
    const parsed = CreateCardInputSchema.parse({ front: 'hola', back: 'hello' });

    expect(parsed).toEqual({ type: 'basic', front: 'hola', back: 'hello', extra: '', tags: [] });
  });

  it('rejects a card without a back', () => {
    expect(CreateCardInputSchema.safeParse({ front: 'hola', back: ' ' }).success).toBe(false);
  });

  it('rejects an unknown card type', () => {
    expect(CreateCardInputSchema.safeParse({ type: 'cloze', front: 'a', back: 'b' }).success).toBe(
      false,
    );
  });

  it('rejects HTML on the front', () => {
    expect(
      CreateCardInputSchema.safeParse({ front: '<img src=x onerror=alert(1)>', back: 'b' }).success,
    ).toBe(false);
  });
});

describe('AddCardsInputSchema', () => {
  it('accepts exactly the batch limit', () => {
    const cards = Array.from({ length: CARD_LIMITS.perBatch }, (_, index) => ({
      front: `q${index}`,
      back: 'a',
    }));

    expect(AddCardsInputSchema.safeParse({ cards }).success).toBe(true);
  });

  it('rejects one card over the batch limit', () => {
    const cards = Array.from({ length: CARD_LIMITS.perBatch + 1 }, (_, index) => ({
      front: `q${index}`,
      back: 'a',
    }));

    expect(AddCardsInputSchema.safeParse({ cards }).success).toBe(false);
  });

  it('rejects an empty batch', () => {
    expect(AddCardsInputSchema.safeParse({ cards: [] }).success).toBe(false);
  });
});

describe('UpdateCardInputSchema', () => {
  it('rejects an empty patch', () => {
    expect(UpdateCardInputSchema.safeParse({}).success).toBe(false);
  });

  it('accepts a content-only patch', () => {
    expect(UpdateCardInputSchema.parse({ back: 'hi' })).toEqual({ back: 'hi' });
  });
});
