import { describe, expect, it } from 'vitest';
import { formatFileSize } from './format-file-size';

describe('formatFileSize', () => {
  it.each([
    [0, '0 byte'],
    [999, '999 byte'],
    [1500, '1.5 kB'],
    [12_345_678, '12.3 MB'],
    [2_000_000_000, '2 GB'],
  ])('%d bytes → %s', (bytes, expected) => {
    expect(formatFileSize(bytes, 'en')).toBe(expected);
  });

  it('uses the locale’s decimal separator', () => {
    expect(formatFileSize(1500, 'sk')).toBe('1,5 kB');
  });

  it('treats nonsense as zero', () => {
    expect(formatFileSize(-5, 'en')).toBe('0 byte');
    expect(formatFileSize(Number.NaN, 'en')).toBe('0 byte');
  });
});
