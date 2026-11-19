import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('joins conditional class names', () => {
    expect(cn('px-2', false, undefined, ['py-1'], { 'font-semibold': true, hidden: false })).toBe(
      'px-2 py-1 font-semibold',
    );
  });

  it('lets the last of two conflicting utilities win', () => {
    expect(cn('bg-lilac px-2', 'bg-rose')).toBe('px-2 bg-rose');
  });

  it('treats the brand sticker shadows as shadows', () => {
    expect(cn('shadow-sticker-sm', 'shadow-none')).toBe('shadow-none');
    expect(cn('shadow-sm', 'shadow-sticker')).toBe('shadow-sticker');
  });

  it('treats the brand card radius as a radius', () => {
    expect(cn('rounded-card', 'rounded-full')).toBe('rounded-full');
  });

  it('keeps a brand text colour next to a font size', () => {
    expect(cn('text-sm', 'text-ink-soft')).toBe('text-sm text-ink-soft');
  });
});
