import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '.';

function Palette({
  onSelect = vi.fn(),
}: {
  onSelect?: (value: string) => void;
}): React.JSX.Element {
  return (
    <Command label="Search Deck Club">
      <CommandInput placeholder="Search decks and actions" />
      <CommandList label="Decks and actions">
        <CommandEmpty>Nothing matches.</CommandEmpty>
        <CommandGroup heading="Decks">
          <CommandItem onSelect={onSelect}>Biology exam</CommandItem>
          <CommandItem onSelect={onSelect}>Spanish verbs</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem onSelect={onSelect}>New deck</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

describe('Command', () => {
  it('names its search field and its list, never with cmdk’s English default', () => {
    render(<Palette />);

    expect(screen.getByRole('combobox', { name: 'Search Deck Club' })).toBeInTheDocument();
    expect(screen.getByRole('listbox', { name: 'Decks and actions' })).toBeInTheDocument();
    expect(screen.queryByRole('listbox', { name: 'Suggestions' })).not.toBeInTheDocument();
  });

  it('keeps separators out of the list box, which may hold only options and groups', () => {
    render(<Palette />);
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });

  it('filters as you type', async () => {
    const user = userEvent.setup();
    render(<Palette />);

    await user.type(screen.getByRole('combobox'), 'span');

    expect(screen.getByRole('option', { name: 'Spanish verbs' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Biology exam' })).not.toBeInTheDocument();
  });

  it('says so when nothing matches', async () => {
    const user = userEvent.setup();
    render(<Palette />);

    await user.type(screen.getByRole('combobox'), 'zzz');
    expect(screen.getByText('Nothing matches.')).toHaveClass('text-ink-soft');
  });

  it('runs the highlighted item with the keyboard', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Palette onSelect={onSelect} />);

    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{ArrowDown}{Enter}');

    expect(onSelect).toHaveBeenCalledWith('Spanish verbs');
  });

  it('highlights the active row with Butter', () => {
    render(<Palette />);
    expect(screen.getByRole('option', { name: 'Biology exam' })).toHaveAttribute(
      'data-selected',
      'true',
    );
    expect(screen.getByRole('option', { name: 'Biology exam' })).toHaveClass(
      'data-[selected=true]:bg-butter',
    );
  });

  it('is a sticker card, or bare inside another surface', () => {
    const { container, rerender } = render(<Command label="Search" />);
    expect(container.firstChild).toHaveClass('rounded-card', 'border-ink');

    rerender(<Command label="Search" variant="bare" />);
    expect(container.firstChild).not.toHaveClass('border-ink');
  });
});

describe('CommandDialog', () => {
  it('is a dialog named and described in the page’s language, without an English close button', () => {
    render(
      <CommandDialog open title="Hľadať v Deck Club" description="Balíčky a akcie">
        <CommandInput placeholder="Hľadať" />
        <CommandList label="Výsledky">
          <CommandItem>Biológia</CommandItem>
        </CommandList>
      </CommandDialog>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Hľadať v Deck Club' });

    expect(dialog).toHaveAccessibleDescription('Balíčky a akcie');
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Hľadať v Deck Club' })).toBeInTheDocument();
  });
});
