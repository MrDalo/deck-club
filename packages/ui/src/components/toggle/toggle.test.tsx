import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Toggle } from '.';

describe('Toggle', () => {
  it('stays pressed and reports it', async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(<Toggle onPressedChange={onPressedChange}>Only due</Toggle>);
    const toggle = screen.getByRole('button', { name: 'Only due' });

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(onPressedChange).toHaveBeenCalledWith(true);
  });

  it('shows on with an Ink outline as well as the Lilac fill', () => {
    render(<Toggle defaultPressed>Only due</Toggle>);
    expect(screen.getByRole('button')).toHaveClass(
      'data-[state=on]:border-ink',
      'data-[state=on]:bg-lilac',
    );
  });

  it('sinks like a pressed sticker as the outline variant', () => {
    render(<Toggle variant="outline">Hints</Toggle>);
    expect(screen.getByRole('button')).toHaveClass(
      'shadow-sticker-sm',
      'data-[state=on]:shadow-none',
    );
  });
});
