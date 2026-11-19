/** Port: fresh invite codes. Random in production, predictable in tests. */
export type InviteCodes = {
  next(): string;
};

/** Nest injection token for {@link InviteCodes}. */
export const INVITE_CODES = Symbol('INVITE_CODES');
