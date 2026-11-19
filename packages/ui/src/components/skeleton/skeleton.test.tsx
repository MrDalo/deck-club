import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton } from '.';

describe('Skeleton', () => {
  it('is a quiet, decorative placeholder', () => {
    const { container } = render(<Skeleton className="h-4 w-40" />);
    const bone = container.firstChild;

    expect(bone).toHaveAttribute('aria-hidden', 'true');
    expect(bone).toHaveClass('bg-line', 'animate-pulse', 'h-4');
    expect(bone).not.toHaveClass('bg-accent');
  });
});
