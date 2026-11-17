import { describe, expect, it } from 'vitest';
import { SignInInputSchema } from './auth.js';

describe('SignInInputSchema', () => {
  it('normalises the email address', () => {
    expect(SignInInputSchema.parse({ email: '  Ana@Example.COM ' })).toEqual({
      email: 'ana@example.com',
    });
  });

  it('rejects something that is not an email', () => {
    expect(SignInInputSchema.safeParse({ email: 'ana' }).success).toBe(false);
  });
});
