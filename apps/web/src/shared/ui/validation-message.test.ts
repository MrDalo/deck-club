import { describe, expect, it } from 'vitest';
import { validationMessageKey } from './validation-message';

describe('validationMessageKey', () => {
  it('keeps a known Zod issue code', () => {
    expect(validationMessageKey('too_big')).toBe('too_big');
  });

  it('maps markup rejections (custom refinements) to their own message', () => {
    expect(validationMessageKey('custom')).toBe('custom');
  });

  it('falls back to a generic key for anything else', () => {
    expect(validationMessageKey('invalid_union')).toBe('invalid');
  });
});
