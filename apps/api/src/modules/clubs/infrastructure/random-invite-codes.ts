import { randomBytes } from 'node:crypto';
import type { InviteCodes } from '../application/ports/invite-codes.js';
import { INVITE_CODE_LENGTH, inviteCodeFrom } from '../domain/invite-code.js';

/** Production adapter for {@link InviteCodes}: codes from the operating system's randomness. */
export const randomInviteCodes: InviteCodes = {
  next: () => inviteCodeFrom(randomBytes(INVITE_CODE_LENGTH)),
};
