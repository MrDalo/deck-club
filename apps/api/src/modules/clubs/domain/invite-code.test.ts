import { describe, expect, it } from 'vitest';
import { INVITE_CODE_LENGTH, inviteCodeFrom, normalizeInviteCode } from './invite-code.js';

describe('inviteCodeFrom', () => {
  it('makes two groups of four unambiguous characters from random bytes', () => {
    expect(inviteCodeFrom(Uint8Array.from([0, 1, 2, 3, 28, 29, 30, 31]))).toBe('ABCD-6789');
  });

  it('uses every byte value evenly, the alphabet repeating every 32', () => {
    expect(inviteCodeFrom(Uint8Array.from([32, 33, 64, 255, 0, 0, 0, 0]))).toBe('ABA9-AAAA');
  });

  it('never uses characters people confuse: 0, O, 1 or I', () => {
    const code = inviteCodeFrom(Uint8Array.from({ length: 256 }, (_, index) => index));

    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  });

  it('refuses too few bytes', () => {
    expect(() => inviteCodeFrom(new Uint8Array(INVITE_CODE_LENGTH - 1))).toThrow();
  });
});

describe('normalizeInviteCode', () => {
  it.each(['K7QP-M2XD', 'k7qp-m2xd', 'K7QPM2XD', ' k7qp m2xd '])(
    'reads "%s" as the stored code',
    (typed) => {
      expect(normalizeInviteCode(typed)).toBe('K7QP-M2XD');
    },
  );

  it('leaves a code of the wrong length ungrouped, so it matches no club', () => {
    expect(normalizeInviteCode('k7q-p')).toBe('K7QP');
  });
});
