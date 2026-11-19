import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Alert, AlertDescription, AlertTitle } from '.';

describe('Alert', () => {
  it('is a polite sky status with an icon by default', () => {
    const { container } = render(
      <Alert>
        <AlertTitle>Cards added</AlertTitle>
        <AlertDescription>Claude added 10 cards.</AlertDescription>
      </Alert>,
    );
    const alert = screen.getByRole('status');

    expect(alert).toHaveClass('bg-sky/60', 'text-ink');
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it.each([
    ['warning', 'alert', 'bg-peach/60'],
    ['danger', 'alert', 'bg-rose/50'],
    ['success', 'status', 'bg-mint/60'],
    ['note', 'status', 'bg-butter/60'],
  ] as const)('announces %s as %s', (tone, role, fill) => {
    render(<Alert tone={tone}>Message</Alert>);
    expect(screen.getByRole(role)).toHaveClass(fill);
  });

  it('keeps danger text Ink, not shadcn’s destructive text colour', () => {
    render(<Alert tone="danger">Could not save</Alert>);
    const alert = screen.getByRole('alert');

    expect(alert).toHaveClass('text-ink');
    expect(alert).not.toHaveClass('text-destructive');
  });

  it('drops the icon or takes another one', () => {
    const { container, rerender } = render(<Alert icon={false}>Plain</Alert>);
    expect(container.querySelector('svg')).toBeNull();

    rerender(<Alert icon={<span data-testid="custom" />}>Custom</Alert>);
    expect(screen.getByTestId('custom')).toBeInTheDocument();
  });

  it('lets the caller choose the live role', () => {
    render(
      <Alert tone="danger" role="status">
        Quiet error
      </Alert>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Quiet error');
  });
});
