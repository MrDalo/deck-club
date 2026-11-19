/** A page number, or a gap before or after the pages around the current one. */
export type PageItem = number | 'gap-start' | 'gap-end';

const range = (from: number, to: number): number[] =>
  Array.from({ length: Math.max(to - from + 1, 0) }, (_, index) => from + index);

/**
 * The pages a pager shows: always the first and the last, the current one
 * with `siblings` neighbours each side, and a gap where pages are skipped
 * ("1 … 4 5 6 … 20"). Always the same number of items, so the pager does
 * not jump around as you page.
 * @param current - the current page, 1-based (clamped into range)
 * @param total - how many pages there are
 * @param siblings - neighbours shown each side of the current page
 * @returns the items to render, in order
 */
export function paginationRange(current: number, total: number, siblings = 1): PageItem[] {
  if (total < 1) return [];
  const page = Math.min(Math.max(current, 1), total);
  const slots = siblings * 2 + 5;
  if (total <= slots) return range(1, total);
  const left = Math.max(page - siblings, 1);
  const right = Math.min(page + siblings, total);
  const gapBefore = left > 3;
  const gapAfter = right < total - 2;
  const edge = siblings * 2 + 3;
  if (!gapBefore) return [...range(1, edge), 'gap-end', total];
  if (!gapAfter) return [1, 'gap-start', ...range(total - edge + 1, total)];
  return [1, 'gap-start', ...range(left, right), 'gap-end', total];
}
