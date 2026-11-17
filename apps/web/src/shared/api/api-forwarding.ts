/** Only these first path segments are forwarded to the core API; everything else is refused. */
const FORWARDED_ROOTS = new Set(['decks']);

/** One path segment: letters, digits, dashes and underscores (UUIDs, `batch`, `cards`). */
const SAFE_SEGMENT = /^[A-Za-z0-9_-]+$/;

/**
 * Builds the core API URL for a BFF request, or null when the path must not
 * be forwarded (unknown resource, traversal, encoded slashes).
 * @param apiBaseUrl - API_INTERNAL_URL, e.g. http://api:4000
 * @param segments - the catch-all route segments after /api/v1
 * @param search - the query string including `?`, or ''
 * @returns the URL to call, or null
 */
export function buildForwardUrl(
  apiBaseUrl: string,
  segments: readonly string[],
  search: string,
): URL | null {
  const [root] = segments;
  if (root === undefined || !FORWARDED_ROOTS.has(root)) return null;
  if (!segments.every((segment) => SAFE_SEGMENT.test(segment))) return null;
  const url = new URL(`/${segments.join('/')}`, apiBaseUrl);
  url.search = search;
  return url;
}
