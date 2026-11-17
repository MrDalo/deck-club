import { describe, expect, it } from 'vitest';
import { CreateDeckInputSchema, UpdateDeckInputSchema } from './deck.js';

describe('CreateDeckInputSchema', () => {
  it('fills defaults for an input with only a title', () => {
    const parsed = CreateDeckInputSchema.parse({ title: '  Spanish verbs  ' });

    expect(parsed).toEqual({ title: 'Spanish verbs', description: '', language: 'en', tags: [] });
  });

  it('rejects an empty title after trimming', () => {
    const result = CreateDeckInputSchema.safeParse({ title: '   ' });

    expect(result.success).toBe(false);
  });

  it('rejects a title longer than 120 characters', () => {
    const result = CreateDeckInputSchema.safeParse({ title: 'x'.repeat(121) });

    expect(result.success).toBe(false);
  });

  it('rejects markup in the description', () => {
    const result = CreateDeckInputSchema.safeParse({
      title: 'Biology',
      description: '<script>alert(1)</script>',
    });

    expect(result.success).toBe(false);
  });

  it('keeps comparison signs that are not tags', () => {
    const parsed = CreateDeckInputSchema.parse({ title: '2 < 3 and 5 > 4' });

    expect(parsed.title).toBe('2 < 3 and 5 > 4');
  });

  it('lowercases tags and drops duplicates', () => {
    const parsed = CreateDeckInputSchema.parse({
      title: 'Verbs',
      tags: ['Spanish', 'spanish', 'A1'],
    });

    expect(parsed.tags).toEqual(['spanish', 'a1']);
  });

  it('rejects an invalid language code', () => {
    const result = CreateDeckInputSchema.safeParse({ title: 'Verbs', language: 'Spanish' });

    expect(result.success).toBe(false);
  });
});

describe('UpdateDeckInputSchema', () => {
  it('accepts a single-field patch', () => {
    expect(UpdateDeckInputSchema.parse({ visibility: 'unlisted' })).toEqual({
      visibility: 'unlisted',
    });
  });

  it('rejects an empty patch', () => {
    expect(UpdateDeckInputSchema.safeParse({}).success).toBe(false);
  });
});
