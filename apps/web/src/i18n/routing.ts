import { defineRouting } from 'next-intl/routing';

/**
 * Locales the UI is translated into (product spec 11: English first, then
 * Slovak and Czech). English URLs carry no prefix; the others do (/sk/decks).
 */
export const routing = defineRouting({
  locales: ['en', 'sk', 'cs'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
});

/** One of the supported UI locales. */
export type Locale = (typeof routing.locales)[number];

/**
 * Narrows a route's `[locale]` segment. The layout already rejects unknown
 * locales with a 404, so the fallback only satisfies the type.
 * @param segment - the raw `[locale]` route parameter
 * @returns a supported locale
 */
export function resolveLocale(segment: string): Locale {
  return (routing.locales as readonly string[]).includes(segment)
    ? (segment as Locale)
    : routing.defaultLocale;
}
