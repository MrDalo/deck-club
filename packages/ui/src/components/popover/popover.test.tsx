import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Button } from '#components/button';
import { Popover, PopoverContent, PopoverTrigger } from '.';

function Filter(): React.JSX.Element {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary">Filter</Button>
      </PopoverTrigger>
      <PopoverContent aria-label="Filter cards">
        <button type="button">Only due</button>
      </PopoverContent>
    </Popover>
  );
}

describe('Popover', () => {
  it('opens a sticker card next to its trigger', async () => {
    const user = userEvent.setup();
    render(<Filter />);
    const trigger = screen.getByRole('button', { name: 'Filter' });

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(await screen.findByRole('dialog', { name: 'Filter cards' })).toHaveClass(
      'rounded-2xl',
      'border-ink',
      'shadow-sticker',
    );
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<Filter />);
    const trigger = screen.getByRole('button', { name: 'Filter' });

    await user.click(trigger);
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
