import { z } from 'zod';
import { IdSchema, LanguageSchema, plainText, TimestampSchema } from './text.js';

/**
 * A member's place in a club (product spec 3, 7). Owners and admins manage
 * the club and its decks; members study and suggest cards.
 */
export const CLUB_ROLES = ['owner', 'admin', 'member'] as const;
export const ClubRoleSchema = z.enum(CLUB_ROLES);
export type ClubRole = z.infer<typeof ClubRoleSchema>;

/** Whether a club is listed publicly or found only through its invite (spec 3). */
export const CLUB_VISIBILITIES = ['private', 'public'] as const;
export const ClubVisibilitySchema = z.enum(CLUB_VISIBILITIES);
export type ClubVisibility = z.infer<typeof ClubVisibilitySchema>;

/** Club limits (spec 7: up to 100 members in v1), shared by the API and the forms. */
export const CLUB_LIMITS = {
  membersMax: 100,
  name: { min: 1, max: 80 },
  description: { min: 0, max: 500 },
} as const;

/**
 * An invite code as people type it: letters and digits, with or without the
 * dash and in any case (the API compares it without them), e.g. `K7QP-M2XD`.
 */
export const InviteCodeSchema = z
  .string()
  .trim()
  .min(4)
  .max(20)
  .regex(/^[A-Za-z0-9 -]+$/, 'Use the letters and digits of the invite code.');

/** Body of `POST /clubs`: a new club, created private unless asked otherwise. */
export const CreateClubInputSchema = z.object({
  name: plainText(CLUB_LIMITS.name),
  description: plainText(CLUB_LIMITS.description).default(''),
  visibility: ClubVisibilitySchema.default('private'),
});
export type CreateClubInput = z.input<typeof CreateClubInputSchema>;
export type CreateClubCommand = z.output<typeof CreateClubInputSchema>;

/** Body of `POST /clubs/join`. */
export const JoinClubInputSchema = z.object({ inviteCode: InviteCodeSchema });
export type JoinClubInput = z.infer<typeof JoinClubInputSchema>;

/** Body of `POST /clubs/:clubId/decks`: one of the caller's own decks, to share with the club. */
export const ShareClubDeckInputSchema = z.object({ deckId: IdSchema });
export type ShareClubDeckInput = z.infer<typeof ShareClubDeckInputSchema>;

/** A deck a club shares, as its members see it. */
export const ClubDeckSchema = z.object({
  id: IdSchema,
  title: z.string(),
  description: z.string(),
  language: LanguageSchema,
  cardCount: z.number().int().nonnegative(),
});
export type ClubDeck = z.infer<typeof ClubDeckSchema>;

/**
 * One club the caller belongs to, with only what a member may see in the
 * app (spec 9: club tools expose no other user's personal data): the club,
 * the caller's own role, how many members it has, and its shared decks.
 */
export const ClubSchema = z.object({
  id: IdSchema,
  name: z.string(),
  description: z.string(),
  visibility: ClubVisibilitySchema,
  /** The caller's role in this club. */
  role: ClubRoleSchema,
  memberCount: z.number().int().min(1).max(CLUB_LIMITS.membersMax),
  memberLimit: z.number().int().min(1).max(CLUB_LIMITS.membersMax),
  /** The code to invite people; only for roles that may invite, otherwise null. */
  inviteCode: z.string().min(1).nullable(),
  /** When the caller joined. */
  joinedAt: TimestampSchema,
  decks: z.array(ClubDeckSchema),
});
export type Club = z.infer<typeof ClubSchema>;

/** Response of `GET /clubs`: the clubs the caller belongs to. */
export const ClubListSchema = z.object({
  clubs: z.array(ClubSchema),
});
export type ClubList = z.infer<typeof ClubListSchema>;
