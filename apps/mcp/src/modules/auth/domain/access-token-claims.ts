/**
 * Supabase Auth signs user access tokens, both session tokens of the web app
 * and tokens its OAuth 2.1 server issues to AI clients, for this audience.
 */
const SUPABASE_USER_AUDIENCE = 'authenticated';

/** The person and AI connection behind a verified access token. */
export type VerifiedPrincipal = {
  /** The Supabase user id (JWT `sub`). */
  userId: string;
  /** The OAuth client (AI connection) the token was issued to; null for a session token. */
  clientId: string | null;
  /** Expiry in seconds since the epoch (JWT `exp`). */
  expiresAt: number;
};

/** Why a signature-valid token is still refused. */
type ClaimsRejection =
  | 'wrong_issuer'
  | 'wrong_audience'
  | 'missing_subject'
  | 'missing_expiry'
  | 'not_a_user'
  | 'anonymous_user';

/** The verdict on a token's claims. */
export type ClaimsVerdict =
  { valid: true; principal: VerifiedPrincipal } | { valid: false; reason: ClaimsRejection };

const audienceIncludes = (audience: unknown, expected: string): boolean =>
  Array.isArray(audience) ? audience.includes(expected) : audience === expected;

const nonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value !== '';

function rejectionOf(
  claims: Readonly<Record<string, unknown>>,
  issuer: string,
): ClaimsRejection | null {
  if (claims.iss !== issuer) return 'wrong_issuer';
  if (!audienceIncludes(claims.aud, SUPABASE_USER_AUDIENCE)) return 'wrong_audience';
  if (!nonEmptyString(claims.sub)) return 'missing_subject';
  if (typeof claims.exp !== 'number') return 'missing_expiry';
  if (claims.role !== 'authenticated') return 'not_a_user';
  if (claims.is_anonymous === true) return 'anonymous_user';
  return null;
}

/**
 * Decides whether the claims of a token whose signature and expiry were
 * already verified belong to a Deck Club user. Signature checks prove who
 * signed the token; these checks prove it was signed for us and for a real,
 * signed-in person: this project's issuer, the user audience, a subject, a
 * user role (not the publishable key's `anon` role) and not an anonymous
 * guest (spec 10: guests keep no decks).
 * @param claims - the verified JWT payload
 * @param issuer - this project's issuer, `<SUPABASE_URL>/auth/v1`
 * @returns the principal, or the reason the token is refused
 */
export function checkAccessTokenClaims(
  claims: Readonly<Record<string, unknown>>,
  issuer: string,
): ClaimsVerdict {
  const rejection = rejectionOf(claims, issuer);
  if (rejection !== null) return { valid: false, reason: rejection };
  return {
    valid: true,
    principal: {
      userId: claims.sub as string,
      clientId: nonEmptyString(claims.client_id) ? claims.client_id : null,
      expiresAt: claims.exp as number,
    },
  };
}

/**
 * The issuer Supabase Auth writes into every token of a project.
 * @param supabaseUrl - the project URL, e.g. https://abc.supabase.co
 * @returns the issuer, e.g. https://abc.supabase.co/auth/v1
 */
export function supabaseIssuer(supabaseUrl: string): string {
  return `${supabaseUrl.replace(/\/+$/, '')}/auth/v1`;
}
