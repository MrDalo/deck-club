import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Switch, SwitchField } from '.';

describe('Switch', () => {
  it('turns on and off, by click and by Space', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="Sound" onCheckedChange={onCheckedChange} />);
    const toggle = screen.getByRole('switch', { name: 'Sound' });

    await user.click(toggle);
    expect(toggle).toBeChecked();
    await user.keyboard(' ');
    expect(toggle).not.toBeChecked();
    expect(onCheckedChange).toHaveBeenCalledTimes(2);
  });

  it('is an Ink track whose thumb slides to show the state', () => {
    render(<Switch aria-label="Sound" />);
    expect(screen.getByRole('switch')).toHaveClass(
      'border-ink',
      '[&>[data-slot=switch-thumb]]:data-[state=checked]:translate-x-[1.375rem]',
    );
  });
});

describe('SwitchField', () => {
  it('names and describes the switch as a settings row', async () => {
    const user = userEvent.setup();
    render(<SwitchField label="Daily reminder" description="An email at 8:00." />);
    const toggle = screen.getByRole('switch', { name: 'Daily reminder' });

    expect(toggle).toHaveAccessibleDescription('An email at 8:00.');
    await user.click(screen.getByText('Daily reminder'));
    expect(toggle).toBeChecked();
  });
});
