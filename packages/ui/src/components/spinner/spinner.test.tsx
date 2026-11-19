import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Spinner } from '.';

describe('Spinner', () => {
  it('is a status named in the page’s language', () => {
    render(<Spinner label="Ukladám" />);
    const spinner = screen.getByRole('status', { name: 'Ukladám' });

    expect(spinner).toHaveClass('text-ink', 'animate-spin', 'size-5');
    expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument();
  });

  it('comes in sizes', () => {
    render(<Spinner label="Loading" size="lg" />);
    expect(screen.getByRole('status')).toHaveClass('size-8');
  });
});
