import { describe, expect, it } from 'vitest';
import { paginationRange } from './pagination-range';

describe('paginationRange', () => {
  it('lists every page when they all fit', () => {
    expect(paginationRange(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(paginationRange(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('skips the end near the start', () => {
    expect(paginationRange(2, 20)).toEqual([1, 2, 3, 4, 5, 'gap-end', 20]);
  });

  it('skips the start near the end', () => {
    expect(paginationRange(19, 20)).toEqual([1, 'gap-start', 16, 17, 18, 19, 20]);
  });

  it('skips both sides in the middle', () => {
    expect(paginationRange(10, 20)).toEqual([1, 'gap-start', 9, 10, 11, 'gap-end', 20]);
  });

  it('keeps the same number of items as you page', () => {
    const lengths = new Set(
      Array.from({ length: 20 }, (_, index) => paginationRange(index + 1, 20).length),
    );
    expect(lengths).toEqual(new Set([7]));
  });

  it('shows more neighbours on request', () => {
    expect(paginationRange(10, 20, 2)).toEqual([1, 'gap-start', 8, 9, 10, 11, 12, 'gap-end', 20]);
  });

  it('clamps the current page and handles no pages', () => {
    expect(paginationRange(99, 3)).toEqual([1, 2, 3]);
    expect(paginationRange(1, 0)).toEqual([]);
  });
});
