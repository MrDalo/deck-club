import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ToggleGroup, ToggleGroupItem } from '.';

describe('ToggleGroup', () => {
  it('chooses one as a set of radio buttons', async () => {
    const user = userEvent.setup();
    render(
      <ToggleGroup type="single" aria-label="Card size" defaultValue="medium">
        <ToggleGroupItem value="small">Small</ToggleGroupItem>
        <ToggleGroupItem value="medium">Medium</ToggleGroupItem>
      </ToggleGroup>,
    );

    expect(screen.getByRole('radio', { name: 'Medium' })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: 'Small' }));
    expect(screen.getByRole('radio', { name: 'Small' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Medium' })).not.toBeChecked();
  });

  it('chooses several as pressed buttons', async () => {
    const user = userEvent.setup();
    render(
      <ToggleGroup type="multiple" aria-label="Show">
        <ToggleGroupItem value="due">Due</ToggleGroupItem>
        <ToggleGroupItem value="new">New</ToggleGroupItem>
      </ToggleGroup>,
    );

    await user.click(screen.getByRole('button', { name: 'Due' }));
    await user.click(screen.getByRole('button', { name: 'New' }));
    expect(screen.getByRole('button', { name: 'Due' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'New' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('joins an outline group into one sticker', () => {
    render(
      <ToggleGroup type="single" variant="outline" aria-label="View">
        <ToggleGroupItem value="cards">Cards</ToggleGroupItem>
      </ToggleGroup>,
    );
    const group = screen.getByRole('radiogroup', { name: 'View' });

    expect(group).toHaveAttribute('data-brand-variant', 'outline');
    expect(group).toHaveClass('shadow-sticker-sm');
    expect(screen.getByRole('radio')).toHaveClass(
      'group-data-[brand-variant=outline]/toggle-group:border-ink',
    );
  });
});
