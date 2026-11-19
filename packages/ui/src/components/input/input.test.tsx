import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Input } from '.';

describe('Input', () => {
  it('takes typing and reports changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input aria-label="Deck title" onChange={onChange} />);

    await user.type(screen.getByRole('textbox', { name: 'Deck title' }), 'Biology');
    expect(screen.getByRole('textbox')).toHaveValue('Biology');
    expect(onChange).toHaveBeenCalledTimes(7);
  });

  it('looks like a brand field with the Focus outline', () => {
    render(<Input aria-label="Deck title" />);
    expect(screen.getByRole('textbox')).toHaveClass(
      'h-11',
      'rounded-xl',
      'border-ink/80',
      'bg-card',
      'focus-visible:outline-focus',
    );
  });

  it('marks an invalid value in Danger', () => {
    render(<Input aria-label="Deck title" aria-invalid />);
    expect(screen.getByRole('textbox')).toHaveClass('aria-invalid:border-danger');
  });

  it('keeps its type and can be disabled', () => {
    render(<Input aria-label="Email" type="email" disabled />);
    const input = screen.getByRole('textbox', { name: 'Email' });

    expect(input).toHaveAttribute('type', 'email');
    expect(input).toBeDisabled();
  });
});
