import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Separator } from '.';

describe('Separator', () => {
  it('is decorative and quiet by default', () => {
    const { container } = render(<Separator />);
    const rule = container.firstChild;

    expect(rule).toHaveAttribute('role', 'none');
    expect(rule).toHaveClass('bg-line', 'data-[orientation=horizontal]:h-0.5');
  });

  it('is a real separator when not decorative, vertical if asked', () => {
    render(<Separator decorative={false} orientation="vertical" />);
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');
  });

  it.each([
    ['ink', 'bg-ink'],
    ['dashed', 'border-dashed'],
  ] as const)('draws the %s variant', (variant, expected) => {
    const { container } = render(<Separator variant={variant} />);
    expect(container.firstChild).toHaveClass(expected);
  });
});
