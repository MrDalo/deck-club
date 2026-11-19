import type { DateRange } from 'react-day-picker';

const LONG: Intl.DateTimeFormatOptions = { dateStyle: 'long' };

/**
 * A date for people, in their language: "November 18, 2026", "18. novembra 2026".
 * @param date - the date
 * @param locale - a BCP 47 tag; the runtime's by default
 * @param options - Intl options; `{ dateStyle: 'long' }` by default
 * @returns the formatted date
 */
export function formatDate(
  date: Date,
  locale?: string,
  options: Intl.DateTimeFormatOptions = LONG,
): string {
  return new Intl.DateTimeFormat(locale, options).format(date);
}

/**
 * A range for people, sharing what both ends share: "November 16 – 20, 2026".
 * @param range - the range; an open range shows its start
 * @param locale - a BCP 47 tag; the runtime's by default
 * @param options - Intl options; `{ dateStyle: 'long' }` by default
 * @returns the formatted range, or `undefined` before a start is picked
 */
export function formatDateRange(
  range: DateRange | null,
  locale?: string,
  options: Intl.DateTimeFormatOptions = LONG,
): string | undefined {
  if (range?.from === undefined) return undefined;
  const format = new Intl.DateTimeFormat(locale, options);
  return range.to === undefined
    ? format.format(range.from)
    : format.formatRange(range.from, range.to);
}
