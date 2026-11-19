import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Progress } from '.';

describe('Progress', () => {
  it('announces its value under its name', () => {
    render(<Progress aria-label="Cards reviewed today" value={60} />);
    const bar = screen.getByRole('progressbar', { name: 'Cards reviewed today' });

    expect(bar).toHaveAttribute('aria-valuenow', '60');
    expect(bar).toHaveClass(
      'border-ink',
      'rounded-full',
      '[&>[data-slot=progress-indicator]]:bg-lilac',
    );
  });

  it('fills with another pastel and size', () => {
    render(<Progress aria-label="Streak" value={30} tone="mint" size="lg" />);
    expect(screen.getByRole('progressbar')).toHaveClass(
      '[&>[data-slot=progress-indicator]]:bg-mint',
      'h-5',
    );
  });

  it('slides when the value is unknown', () => {
    render(<Progress aria-label="Importing" value={null} />);
    const bar = screen.getByRole('progressbar');

    expect(bar).toHaveAttribute('data-state', 'indeterminate');
    expect(bar).not.toHaveAttribute('aria-valuenow');
  });

  it('reports completion', () => {
    render(<Progress aria-label="Upload" value={100} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('data-state', 'complete');
  });
});
