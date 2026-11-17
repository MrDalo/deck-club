import { CreateDeckInputSchema } from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import { AppError } from '../errors/app-error.js';
import { parseBody, parseId } from './parse-input.js';

describe('parseBody', () => {
  it('returns the parsed output with defaults applied', () => {
    expect(parseBody(CreateDeckInputSchema, { title: 'Verbs' }).language).toBe('en');
  });

  it('throws VALIDATION_FAILED naming the bad field', () => {
    try {
      parseBody(CreateDeckInputSchema, { title: '' });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe('VALIDATION_FAILED');
      expect((error as AppError).issues?.[0]?.path).toBe('title');
    }
  });
});

describe('parseId', () => {
  const notFound = new AppError('DECK_NOT_FOUND', 'No such deck.');

  it('accepts a UUID', () => {
    expect(parseId('00000000-0000-4000-8000-000000000001', notFound)).toBe(
      '00000000-0000-4000-8000-000000000001',
    );
  });

  it('throws the given not-found error for anything else', () => {
    expect(() => parseId('../etc/passwd', notFound)).toThrow(notFound);
  });
});
