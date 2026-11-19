import { AppError } from '../../../common/errors/app-error.js';
import type { Membership } from '../domain/club.js';
import type { ClubRepository } from './ports/club-repository.js';

/** The error for a club that is missing or that the caller is not in: both look the same. */
export function clubNotFound(): AppError {
  return new AppError('CLUB_NOT_FOUND', 'You are not a member of a club with that id.');
}

/** The error for an invite code that opens no club. */
export function inviteCodeNotFound(): AppError {
  return new AppError(
    'CLUB_NOT_FOUND',
    'No club has that invite code. Check the code with the person who shared it.',
  );
}

/**
 * Loads the caller's membership of a club.
 * @param clubs - the club repository
 * @param userId - the signed-in user
 * @param clubId - the requested club
 * @returns the membership
 * @throws AppError CLUB_NOT_FOUND when the club does not exist or the user is not in it
 */
export async function loadMembership(
  clubs: ClubRepository,
  userId: string,
  clubId: string,
): Promise<Membership> {
  const membership = await clubs.findMembership(clubId, userId);
  if (membership === null) throw clubNotFound();
  return membership;
}
