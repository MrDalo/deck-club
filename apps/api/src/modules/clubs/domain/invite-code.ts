/**
 * The characters of an invite code: capitals and digits without the ones
 * people confuse when reading a code aloud or from a screen (0/O, 1/I). 32 of
 * them, so a random byte maps onto one evenly.
 */
const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** How many characters an invite code has, shown in two groups of four. */
export const INVITE_CODE_LENGTH = 8;

const group = (characters: string): string =>
  `${characters.slice(0, INVITE_CODE_LENGTH / 2)}-${characters.slice(INVITE_CODE_LENGTH / 2)}`;

/**
 * Turns random bytes into an invite code such as `K7QP-M2XD` (spec 4.6: a
 * club is joined with an invite code). 32^8 codes make guessing one
 * impractical; the source of randomness is the caller's.
 * @param bytes - at least {@link INVITE_CODE_LENGTH} random bytes
 * @returns the code, grouped for reading
 * @throws Error when too few bytes are given (a programming error)
 */
export function inviteCodeFrom(bytes: Uint8Array): string {
  if (bytes.length < INVITE_CODE_LENGTH)
    throw new Error(`An invite code needs ${INVITE_CODE_LENGTH} random bytes.`);
  const characters = [...bytes.subarray(0, INVITE_CODE_LENGTH)]
    .map((byte) => INVITE_ALPHABET[byte % INVITE_ALPHABET.length])
    .join('');
  return group(characters);
}

/**
 * Reads an invite code as a person typed it: any case, with or without the
 * dash or spaces. A code that cannot be one comes back as typed (cleaned),
 * so it simply matches no club.
 * @param typed - the code as entered
 * @returns the code as stored, e.g. `K7QP-M2XD`
 */
export function normalizeInviteCode(typed: string): string {
  const characters = typed.toUpperCase().replaceAll(/[^A-Z0-9]/g, '');
  return characters.length === INVITE_CODE_LENGTH ? group(characters) : characters;
}
