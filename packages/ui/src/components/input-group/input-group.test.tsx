import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchIcon } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText } from '.';

function Search({ onClear = vi.fn() }: { onClear?: () => void }): React.JSX.Element {
  return (
    <InputGroup>
      <InputGroupInput aria-label="Search cards" placeholder="Search cards" />
      <InputGroupAddon>
        <SearchIcon aria-hidden />
      </InputGroupAddon>
      <InputGroupAddon align="inline-end">
        <InputGroupText>12 results</InputGroupText>
        <InputGroupButton onClick={onClear}>Clear</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

describe('InputGroup', () => {
  it('draws the field on the group, with one Focus outline for it all', () => {
    render(<Search />);
    const group = screen.getAllByRole('group')[0];

    expect(group).toHaveClass(
      'border-ink/80',
      'rounded-xl',
      'has-[[data-slot=input-group-control]:focus-visible]:outline-focus',
    );
  });

  it('focuses the control when an addon is clicked', async () => {
    const user = userEvent.setup();
    render(<Search />);

    await user.click(screen.getByText('12 results'));
    expect(screen.getByRole('textbox', { name: 'Search cards' })).toHaveFocus();
  });

  it('runs its button without stealing focus into the field', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(<Search onClear={onClear} />);

    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onClear).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Clear' })).toHaveAttribute('type', 'button');
  });

  it('marks the whole group in Danger when its control is invalid', () => {
    render(
      <InputGroup>
        <InputGroupInput aria-label="Price" aria-invalid />
      </InputGroup>,
    );
    expect(screen.getByRole('group')).toHaveClass(
      'has-[[data-slot][aria-invalid=true]]:border-danger',
    );
  });
});
