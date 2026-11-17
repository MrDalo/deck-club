/**
 * Keeps a post-sign-in redirect on this site. Anything that is not a plain
 * same-origin path (`//evil.com`, `https://…`, `/\evil.com`) becomes the fallback.
 * @param candidate - the `next` query parameter
 * @param fallback - where to go otherwise
 * @returns a path that starts with a single slash
 */
export function safeRedirectPath(candidate: string | null, fallback = '/decks'): string {
  if (!candidate?.startsWith('/')) return fallback;
  if (candidate.startsWith('//') || candidate.includes('\\')) return fallback;
  return candidate;
}
