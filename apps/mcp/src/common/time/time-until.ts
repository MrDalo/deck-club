const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const DAYS_PER_MONTH = 30.44;
const DAYS_PER_YEAR = 365.25;

const amount = (count: number, unit: string): string => `${count} ${unit}${count === 1 ? '' : 's'}`;

/**
 * How long until a moment, rounded to the unit a person would say: what a
 * rating button shows ("10 min", "3 days") and what the AI tells the user
 * ("back in 3 days"). Presentation only: when a card is due is the API's
 * decision.
 * @param from - the moment counted from, an ISO timestamp
 * @param to - the moment counted to, an ISO timestamp
 * @returns "under a minute", "N min", "N hours", "N days", "N months" or "N years"
 */
export function timeUntil(from: string, to: string): string {
  const ms = Date.parse(to) - Date.parse(from);
  const minutes = Math.round(ms / MINUTE_MS);
  if (minutes < 1) return 'under a minute';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(ms / HOUR_MS);
  if (hours < 24) return amount(hours, 'hour');
  const days = Math.round(ms / DAY_MS);
  if (days < 31) return amount(days, 'day');
  const months = Math.round(days / DAYS_PER_MONTH);
  if (months < 12) return amount(months, 'month');
  return amount(Math.round(days / DAYS_PER_YEAR), 'year');
}
