import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '.';

function Language({
  onValueChange = vi.fn(),
}: {
  onValueChange?: (value: string) => void;
}): React.JSX.Element {
  return (
    <Select onValueChange={onValueChange}>
      <SelectTrigger aria-label="Deck language">
        <SelectValue placeholder="Choose a language" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Most used</SelectLabel>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="sk">Slovenčina</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

describe('Select', () => {
  it('shows the placeholder in a brand field', () => {
    render(<Language />);
    const trigger = screen.getByRole('combobox', { name: 'Deck language' });

    expect(trigger).toHaveTextContent('Choose a language');
    expect(trigger).toHaveClass(
      'border-ink/80',
      'data-[size=default]:h-11',
      'focus-visible:outline-focus',
    );
  });

  it('opens a sticker list and chooses an option', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Language onValueChange={onValueChange} />);

    await user.click(screen.getByRole('combobox', { name: 'Deck language' }));
    expect(await screen.findByRole('listbox')).toHaveClass('border-ink', 'shadow-sticker');
    await user.click(screen.getByRole('option', { name: 'Slovenčina' }));

    expect(onValueChange).toHaveBeenCalledWith('sk');
    expect(screen.getByRole('combobox')).toHaveTextContent('Slovenčina');
  });

  it('groups options under a label', async () => {
    const user = userEvent.setup();
    render(<Language />);

    await user.click(screen.getByRole('combobox'));
    expect(await screen.findByRole('group', { name: 'Most used' })).toBeInTheDocument();
  });
});
