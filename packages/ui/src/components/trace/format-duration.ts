const unit = (value: number, name: 'millisecond' | 'second' | 'minute', locale?: string): string =>
  new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: name,
    unitDisplay: 'short',
    maximumFractionDigits: name === 'second' ? 1 : 0,
  }).format(value);

/**
 * How long a step took, for people: "820 ms", "1.4 sec", "2 min, 5 sec" in the
 * given locale. Under a second in milliseconds, under a minute in seconds
 * (one decimal), otherwise whole minutes and seconds.
 * @param milliseconds - the duration in milliseconds
 * @param locale - a BCP 47 tag; the runtime's by default
 * @returns the formatted duration
 */
export function formatDuration(milliseconds: number, locale?: string): string {
  const safe = Number.isFinite(milliseconds) && milliseconds > 0 ? milliseconds : 0;
  if (Math.round(safe) < 1000) return unit(Math.round(safe), 'millisecond', locale);
  if (safe < 59_950) return unit(safe / 1000, 'second', locale);

  const totalSeconds = Math.round(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const parts = [unit(minutes, 'minute', locale)];
  if (seconds > 0) parts.push(unit(seconds, 'second', locale));
  return new Intl.ListFormat(locale, { type: 'unit', style: 'short' }).format(parts);
}
