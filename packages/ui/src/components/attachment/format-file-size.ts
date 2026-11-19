const UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte'] as const;

/**
 * A file size for people: "512 B", "1.5 kB", "12,3 MB" in the given locale.
 * Decimal units (1 kB = 1000 B), as operating systems show them.
 * @param bytes - the size in bytes
 * @param locale - a BCP 47 tag; the runtime's by default
 * @returns the formatted size
 */
export function formatFileSize(bytes: number, locale?: string): string {
  const safe = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
  const exponent = safe === 0 ? 0 : Math.min(Math.floor(Math.log10(safe) / 3), UNITS.length - 1);
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: UNITS[exponent] ?? 'byte',
    unitDisplay: 'short',
    maximumFractionDigits: exponent === 0 ? 0 : 1,
  }).format(safe / 1000 ** exponent);
}
